#!/usr/bin/env bash
# Registers the factory's scheduled jobs with the OpenClaw gateway, and installs
# the Slack-heartbeat LaunchAgent (gateway-independent; see slack-heartbeat.sh).
# Run once after OpenClaw + Slack are configured (README step 4).
# Re-runnable: declaration keys make each job idempotent (check `openclaw cron list`),
# and the LaunchAgent is rewritten + reloaded in place.
#
# Syntax verified against OpenClaw 2026.7 (`openclaw cron add --help`), and the
# delivery model verified by live test-fire:
# - main-session jobs take --system-event payloads and CANNOT deliver to channels
#   ("--announce/--no-deliver require a non-main agentTurn or command session target").
#   A main-session standup composed the post but never sent it.
# - Jobs that must POST to Slack therefore run as isolated agent turns with
#   --announce: the job's final message is delivered to the channel by the gateway,
#   not left to agent discretion. Workspace/skills still load (same agent).
# - Agent jobs default to a 30s timeout — far too short for a standup turn —
#   so every job sets --timeout-seconds explicitly.
set -euo pipefail

# Channel ID comes from the environment, or falls back to openclaw/secrets.env.
if [ -z "${FACTORY_STANDUP_CHANNEL:-}" ] && [ -f "$(dirname "$0")/secrets.env" ]; then
  set -a; . "$(dirname "$0")/secrets.env"; set +a
fi
STANDUP_CHANNEL="${FACTORY_STANDUP_CHANNEL:?Set FACTORY_STANDUP_CHANNEL (or fill openclaw/secrets.env) to the Slack channel ID (C...) of #factory-standup}"

# Daily standup — 08:00 local. Isolated turn; final message is the standup post,
# delivered to #factory-standup via --announce.
# (CLI stdin is detached — without < /dev/null these calls hang on a TTY check.)
openclaw cron add "0 8 * * *" \
  "Run the factory-standup skill: prepare today's standup. Your final message must be ONLY the standup post itself (it is delivered verbatim to the Slack #factory-standup channel)." \
  --name "factory-daily-standup" \
  --declaration-key "factory-daily-standup" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:${STANDUP_CHANNEL}" \
  --timeout-seconds 900
  < /dev/null

# Standup cutoff sweep — 11:00 local. Reads the standup thread; if the founder
# hasn't replied, locks in the proposal (its confirmation posts to the channel).
openclaw cron add "0 11 * * *" \
  "Standup cutoff: read today's standup thread in the Slack #factory-standup channel. If the founder HAS replied, re-plan per their message and reply briefly in-channel with the adjusted plan. If the founder has NOT replied, post in-channel that the posted proposal now proceeds, update STATE.md, and dispatch the day's tasks via the factory-dispatch skill. Your final message must be ONLY the channel post itself." \
  --name "factory-standup-cutoff" \
  --declaration-key "factory-standup-cutoff" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:${STANDUP_CHANNEL}" \
  --timeout-seconds 900
  < /dev/null

# Evening state sync — 18:00. Housekeeping in the main session; nothing to post.
openclaw cron add "0 18 * * *" \
  --name "factory-eod-sync" \
  --declaration-key "factory-eod-sync" \
  --session main \
  --system-event "end-of-day sync: verify every in-flight item in STATE.md and app STATUS.md files against git logs and session records; correct stale entries; note anything that needs founder attention tomorrow." \
  --timeout-seconds 600
  < /dev/null

# Weekly self-review — Sunday 17:00. Isolated turn kicks off the self-review
# workflow; the run engine handles the Slack plan gate + spawned implementation.
openclaw cron add "0 17 * * 0" \
  "Run the factory-self-review skill: start a self-review run (factory-run start --rig app-factory --workflow self-review --prompt 'weekly self-review: find the highest-leverage harness improvement'). Your final message must be one short line announcing the run id and that the improvement plan will arrive in #factory-builds for approval." \
  --name "factory-weekly-self-review" \
  --declaration-key "factory-weekly-self-review" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:${STANDUP_CHANNEL}" \
  --timeout-seconds 600 \
  < /dev/null

# Slack leaked-socket watchdog — every 10 min. Deterministic command job (sh -lc
# on the Gateway, no agent): scans the current gateway log for the socket-mode
# leak signature (health-monitor disconnect flaps / "N active connections"
# warnings) and issues a detached full-gateway restart when it matches, with a
# 60-min cooldown. See openclaw/slack-leak-watchdog.sh.
# (Flag set live-verified against 2026.7.1-2 via a --disabled probe job.)
openclaw cron add \
  --name "slack-leak-watchdog" \
  --declaration-key "slack-leak-watchdog" \
  --cron "*/10 * * * *" \
  --command "$(cd "$(dirname "$0")" && pwd)/slack-leak-watchdog.sh" \
  < /dev/null

# --- Phase 3 additions (do not enable yet — see docs/07-roadmap.md) ---
# nightly analytics pull, weekly marketing calendar prep, weekly retro prompt

# Slack heartbeat — every 10 min, stamps the three factory channels' topics with
# "OpenClaw: <online|offline> — heartbeat ...". Deliberately a LaunchAgent, not
# an openclaw cron: it must keep reporting "offline" when the gateway is dead,
# and must not burn an agent turn every 10 minutes.
FACTORY_DIR="$(cd "$(dirname "$0")" && pwd)"
HEARTBEAT_LABEL="ai.openclaw.factory-heartbeat"
HEARTBEAT_PLIST="$HOME/Library/LaunchAgents/${HEARTBEAT_LABEL}.plist"
mkdir -p "$HOME/Library/LaunchAgents" /tmp/openclaw
cat > "$HEARTBEAT_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${HEARTBEAT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${FACTORY_DIR}/slack-heartbeat.sh</string>
  </array>
  <key>StartInterval</key>
  <integer>600</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/openclaw/heartbeat.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/openclaw/heartbeat.log</string>
</dict>
</plist>
EOF
plutil -lint "$HEARTBEAT_PLIST" > /dev/null
# Reload (bootout fails harmlessly when the job isn't loaded yet).
launchctl bootout "gui/$(id -u)" "$HEARTBEAT_PLIST" 2> /dev/null || true
launchctl bootstrap "gui/$(id -u)" "$HEARTBEAT_PLIST"

echo "Factory crons registered. Verify with: openclaw cron list"
echo "Heartbeat LaunchAgent ${HEARTBEAT_LABEL} loaded (topic stamp every 10 min,"
echo "log: /tmp/openclaw/heartbeat.log)."
echo "NOTE: topic writes need the channels:manage + groups:write scopes — re-apply"
echo "openclaw/slack-app-manifest.json at api.slack.com and reinstall the app to"
echo "the workspace, or the heartbeat logs missing_scope."
