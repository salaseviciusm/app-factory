#!/usr/bin/env bash
# Registers the factory's scheduled jobs with the OpenClaw gateway.
# Run once after OpenClaw + Slack are configured (README step 4).
# Re-runnable: declaration keys make each job idempotent (check `openclaw cron list`).
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

# --- Phase 3 additions (do not enable yet — see docs/07-roadmap.md) ---
# nightly analytics pull, weekly marketing calendar prep, weekly retro prompt

echo "Factory crons registered. Verify with: openclaw cron list"
