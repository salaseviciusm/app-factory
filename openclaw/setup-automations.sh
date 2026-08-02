#!/usr/bin/env bash
# Registers the factory's scheduled jobs with the OpenClaw gateway.
# Run once after OpenClaw + Slack are configured (README step 4).
# Re-runnable: delete existing jobs first via `openclaw automations list` / delete.
#
# NOTE: verify flag names against your installed version (`openclaw automations create --help`);
# the CLI has evolved (legacy alias: `openclaw cron`).
set -euo pipefail

STANDUP_CHANNEL="${FACTORY_STANDUP_CHANNEL:?Set FACTORY_STANDUP_CHANNEL to the Slack channel ID (C...) of #factory-standup}"

# Daily standup — 08:00 local, posts to #factory-standup.
openclaw automations create "0 8 * * *" \
  "Run the factory-standup skill: prepare and post today's standup." \
  --name "factory-daily-standup" \
  --session main \
  --announce \
  --channel slack \
  --to "channel:${STANDUP_CHANNEL}"

# Standup cutoff sweep — 11:00 local: if the founder hasn't replied, lock in the proposal.
openclaw automations create "0 11 * * *" \
  "Standup cutoff check: if the founder has not replied to today's standup thread, confirm in-thread that the posted proposal now proceeds, update STATE.md, and dispatch the day's tasks via the factory-dispatch skill." \
  --name "factory-standup-cutoff" \
  --session main \
  --announce \
  --channel slack \
  --to "channel:${STANDUP_CHANNEL}"

# Evening state sync — 18:00: reconcile STATE.md and app STATUS files with reality.
openclaw automations create "0 18 * * *" \
  "End-of-day sync: verify every in-flight item in STATE.md and app STATUS.md files against git logs and session records; correct stale entries; note anything that needs founder attention tomorrow." \
  --name "factory-eod-sync" \
  --session main

# --- Phase 3 additions (do not enable yet — see docs/07-roadmap.md) ---
# nightly analytics pull, weekly marketing calendar prep, weekly retro prompt

echo "Factory automations registered. Verify with: openclaw automations list"
