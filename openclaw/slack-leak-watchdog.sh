#!/usr/bin/env bash
# Detect-and-recover watchdog for the OpenClaw Slack socket-mode connection leak.
#
# Upstream bug (OpenClaw 2026.7.1-2): while DNS is down the health-monitor's
# restart cycle skips stopChannel (status.running is false) but still calls
# startChannel, orphaning one SocketModeClient per ~15-min cycle. When the
# network returns, every orphan connects; Slack round-robins events across them
# and the bot goes silent while the gateway still reports healthy. Only a full
# `openclaw gateway restart` (process death) clears the orphans.
#
# Detection is purely log-pattern based (the process stays probe-ok throughout).
# Within a 45-min window of the current gateway log we count:
#   flaps   = "[slack:default] health-monitor: restarting (reason: disconnected)"
#   maxconn = max N from "slack socket mode reports N active connections"
# Trigger: flaps >= 3, OR (maxconn >= 2 AND flaps >= 1). A 60-min cooldown
# state file prevents a restart storm while the network is genuinely down.
#
# Deterministic by design: no agent/LLM, no network probing. Env overrides
# (SLW_*) exist only so tests can replay fixtures with the restart stubbed.
set -euo pipefail

LOG_DIR="${SLW_LOG_DIR:-/tmp/openclaw}"
STATE_FILE="${SLW_STATE_FILE:-/tmp/openclaw/slack-leak-watchdog.state}"
DECISION_LOG="${SLW_DECISION_LOG:-/tmp/openclaw/slack-leak-watchdog.log}"
RESTART_CMD="${SLW_RESTART_CMD:-openclaw gateway restart}"
WINDOW_MIN=45
COOLDOWN_SECS=3600
TAIL_LINES=4000

FLAP_SIG='[slack:default] health-monitor: restarting (reason: disconnected)'

mkdir -p "$(dirname "$DECISION_LOG")"
note() { printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$1" >> "$DECISION_LOG"; }

# Current log = newest openclaw-*.log by mtime (file rolls daily); nothing to do if absent.
log_file="$(ls -t "$LOG_DIR"/openclaw-*.log 2>/dev/null | head -n 1 || true)"
if [ -z "$log_file" ]; then
  note "checked: no gateway log in $LOG_DIR; nothing to do"
  exit 0
fi

# Window cutoff, compared lexicographically against each line's local-offset
# "time" field (first 16 chars, YYYY-MM-DDTHH:MM). BSD date.
cutoff="$(date -v-"${WINDOW_MIN}"M '+%Y-%m-%dT%H:%M')"

read -r flaps maxconn <<EOF
$(tail -n "$TAIL_LINES" "$log_file" | awk -v cutoff="$cutoff" -v flap_sig="$FLAP_SIG" '
  {
    if (!match($0, /"time":"[0-9][^"]*"/)) next
    t = substr($0, RSTART + 8, RLENGTH - 9)
    if (substr(t, 1, 16) < cutoff) next
    if (index($0, flap_sig) > 0) flaps++
    if (match($0, /slack socket mode reports [0-9]+ active connections/)) {
      n = substr($0, RSTART, RLENGTH)
      gsub(/[^0-9]/, "", n)
      if (n + 0 > maxconn) maxconn = n + 0
    }
  }
  END { print flaps + 0, maxconn + 0 }
')
EOF

if [ "$flaps" -ge 3 ] || { [ "$maxconn" -ge 2 ] && [ "$flaps" -ge 1 ]; }; then
  now="$(date +%s)"
  last_restart="$(cat "$STATE_FILE" 2>/dev/null || true)"
  case "$last_restart" in ''|*[!0-9]*) last_restart=0 ;; esac
  if [ $((now - last_restart)) -lt "$COOLDOWN_SECS" ]; then
    note "cooldown-skip: flaps=$flaps maxconn=$maxconn (last restart $((now - last_restart))s ago)"
    exit 0
  fi
  printf '%s\n' "$now" > "$STATE_FILE"
  note "triggered: flaps=$flaps maxconn=$maxconn window=${WINDOW_MIN}m log=$log_file; issuing gateway restart"
  # Detached: this job runs as a child of the gateway (cron --command is sh -lc
  # on the Gateway) and the restart kills its own process tree — nohup lets the
  # recovery survive its parent's death (the job may then be reported failed;
  # harmless, the restart has already happened). < /dev/null is mandatory: the
  # CLI hangs on a TTY check with detached stdin.
  nohup sh -c "$RESTART_CMD < /dev/null" >> "$DECISION_LOG" 2>&1 &
else
  note "checked: flaps=$flaps maxconn=$maxconn window=${WINDOW_MIN}m log=$log_file; no restart"
fi
exit 0
