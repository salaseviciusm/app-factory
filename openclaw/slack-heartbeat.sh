#!/usr/bin/env bash
# Stamps the topic of the three factory Slack channels with
# "OpenClaw: <online|offline> — heartbeat YYYY-MM-DD HH:MM" so the founder can
# see from any Slack client whether the factory gateway is actually alive.
#
# "online" is a real end-to-end signal — gateway reachable AND its slack channel
# running AND a live auth.test probe ok (`openclaw channels status --probe`) —
# not mere process existence. The script talks to the Slack Web API directly
# with SLACK_BOT_TOKEN, so it can still stamp "offline" when the gateway is dead.
#
# Scope prerequisite: conversations.setTopic needs channels:manage (public
# channels) and groups:write (private). Both are in slack-app-manifest.json;
# if this logs missing_scope, re-apply the manifest at api.slack.com and
# reinstall the app to the workspace (README Step 4).
#
# Installed as LaunchAgent ai.openclaw.factory-heartbeat (StartInterval 600) by
# setup-automations.sh; logs to /tmp/openclaw/heartbeat.log.
set -euo pipefail

# launchd starts jobs with a minimal PATH; openclaw + node live in Homebrew.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

FACTORY_DIR="$(cd "$(dirname "$0")" && pwd)"

# Token + channel IDs come from the environment, or fall back to secrets.env.
REQUIRED_VARS=(SLACK_BOT_TOKEN FACTORY_STANDUP_CHANNEL FACTORY_APPROVALS_CHANNEL FACTORY_BUILDS_CHANNEL)
if [ -f "$FACTORY_DIR/secrets.env" ]; then
  for v in "${REQUIRED_VARS[@]}"; do
    if [ -z "$(eval "echo \${$v:-}")" ]; then
      set -a; . "$FACTORY_DIR/secrets.env"; set +a
      break
    fi
  done
fi
for v in "${REQUIRED_VARS[@]}"; do
  eval "val=\${$v:-}"
  if [ -z "$val" ] || [[ "$val" == *REPLACE* ]]; then
    echo "ERROR: $v not set in the environment or openclaw/secrets.env" >&2
    exit 1
  fi
done

# Gateway health → online/offline. node spawns the CLI itself: stdin detached
# (documented TTY-hang gotcha) and a hard 30s timeout; any failure — gateway
# down, timeout, unparseable output — reads as offline, never a crash.
STATUS="$(node -e '
const { execFileSync } = require("child_process");
let out = "";
try {
  out = execFileSync("openclaw", ["channels", "status", "--probe", "--json"],
    { stdio: ["ignore", "pipe", "ignore"], timeout: 30000, encoding: "utf8" });
} catch (e) { console.log("offline"); process.exit(0); }
try {
  const s = JSON.parse(out).channels.slack;
  console.log(s && s.running === true && s.probe && s.probe.ok === true ? "online" : "offline");
} catch (e) { console.log("offline"); }
')"

TOPIC="OpenClaw: ${STATUS} — heartbeat $(date '+%Y-%m-%d %H:%M')"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] status=${STATUS}"

FAILED=0
for pair in "standup:${FACTORY_STANDUP_CHANNEL}" "approvals:${FACTORY_APPROVALS_CHANNEL}" "builds:${FACTORY_BUILDS_CHANNEL}"; do
  name="${pair%%:*}"; channel="${pair#*:}"

  # Read the current topic and skip the write when unchanged, so retries and
  # double-fires never produce no-op API writes.
  current="$(curl -sS --max-time 15 -G "https://slack.com/api/conversations.info" \
      -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
      --data-urlencode "channel=${channel}" \
    | node -e '
      let d = {};
      try { d = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch (e) {}
      console.log(d.ok && d.channel && d.channel.topic ? d.channel.topic.value : "");
    ' || true)"
  if [ "$current" = "$TOPIC" ]; then
    echo "  ${name}: topic already current, skipping"
    continue
  fi

  # A failure on one channel is logged but must not stop the remaining ones.
  err="$(node -e 'console.log(JSON.stringify({ channel: process.argv[1], topic: process.argv[2] }))' "$channel" "$TOPIC" \
    | curl -sS --max-time 15 -X POST "https://slack.com/api/conversations.setTopic" \
        -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
        -H "Content-Type: application/json; charset=utf-8" \
        --data @- \
    | node -e '
      let d = {};
      try { d = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch (e) {}
      console.log(d.ok === true ? "" : (d.error || "no/invalid response"));
    ' || echo "curl/parse failure")"
  if [ -n "$err" ]; then
    echo "  ${name}: setTopic FAILED (${err})" >&2
    FAILED=1
  else
    echo "  ${name}: topic updated"
  fi
done

exit "$FAILED"
