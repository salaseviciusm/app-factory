#!/usr/bin/env bash
# Stamps the topic of the #factory-status Slack channel with
# "OpenClaw: <online|offline> — heartbeat YYYY-MM-DD HH:MM" so the founder can
# see from any Slack client whether the factory gateway is actually alive.
# This is the ONLY channel the heartbeat touches — standup/approvals/builds
# topics are left alone.
#
# "online" is a real end-to-end signal — gateway reachable AND its slack channel
# running AND a live auth.test probe ok (`openclaw channels status --probe`) —
# not mere process existence. The script talks to the Slack Web API directly
# with SLACK_BOT_TOKEN, so it can still stamp "offline" when the gateway is dead.
#
# The channel is resolved by NAME via lib/slack-channel.mjs and created on
# demand if missing (channels:manage covers conversations.create; the bot is
# auto-member of channels it creates). Set FACTORY_STATUS_CHANNEL in the env or
# secrets.env to pin an explicit C... ID and skip lookup/creation entirely.
#
# Scope prerequisite: conversations.setTopic/create need channels:manage (public
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

# Token (and the optional FACTORY_STATUS_CHANNEL override) come from the
# environment, or fall back to secrets.env.
if [ -f "$FACTORY_DIR/secrets.env" ] && { [ -z "${SLACK_BOT_TOKEN:-}" ] || [ -z "${FACTORY_STATUS_CHANNEL:-}" ]; }; then
  set -a; . "$FACTORY_DIR/secrets.env"; set +a
fi
if [ -z "${SLACK_BOT_TOKEN:-}" ] || [[ "${SLACK_BOT_TOKEN}" == *REPLACE* ]]; then
  echo "ERROR: SLACK_BOT_TOKEN not set in the environment or openclaw/secrets.env" >&2
  exit 1
fi

# #factory-status: explicit ID wins; otherwise resolve by name (create on demand).
STATUS_CHANNEL="${FACTORY_STATUS_CHANNEL:-}"
if [ -z "$STATUS_CHANNEL" ] || [[ "$STATUS_CHANNEL" == *REPLACE* ]]; then
  if ! STATUS_CHANNEL="$(node "$FACTORY_DIR/lib/slack-channel.mjs" factory-status)"; then
    echo "ERROR: could not resolve/create #factory-status (see stderr above)" >&2
    exit 1
  fi
fi

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

# Read the current topic and skip the write when unchanged, so retries and
# double-fires never produce no-op API writes.
current="$(curl -sS --max-time 15 -G "https://slack.com/api/conversations.info" \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
    --data-urlencode "channel=${STATUS_CHANNEL}" \
  | node -e '
    let d = {};
    try { d = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch (e) {}
    console.log(d.ok && d.channel && d.channel.topic ? d.channel.topic.value : "");
  ' || true)"
if [ "$current" = "$TOPIC" ]; then
  echo "  factory-status: topic already current, skipping"
  exit 0
fi

err="$(node -e 'console.log(JSON.stringify({ channel: process.argv[1], topic: process.argv[2] }))' "$STATUS_CHANNEL" "$TOPIC" \
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
  echo "  factory-status: setTopic FAILED (${err})" >&2
  exit 1
fi
echo "  factory-status: topic updated"
