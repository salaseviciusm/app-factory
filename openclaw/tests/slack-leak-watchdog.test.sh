#!/usr/bin/env bash
# Replay tests for openclaw/slack-leak-watchdog.sh (bug-msf24226).
# Synthesizes gateway-log fixtures in the live JSON-lines shape and runs the
# watchdog with the restart command stubbed (SLW_* overrides). BSD date.
set -euo pipefail

WATCHDOG="$(cd "$(dirname "$0")/.." && pwd)/slack-leak-watchdog.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FLAP='[slack:default] health-monitor: restarting (reason: disconnected)'
STOPPED='[slack:default] health-monitor: restarting (reason: stopped)'
CONN2='slack socket mode reports 2 active connections for this Slack app; Slack may deliver each event to any one connection'

fails=0
check() { # check <desc> <cmd...>
  local desc="$1"; shift
  if "$@"; then echo "ok   - $desc"; else echo "FAIL - $desc"; fails=$((fails + 1)); fi
}

line() { # line <bsd-date-offset e.g. -10M> <message>
  printf '{"0":"{\\"subsystem\\":\\"gateway\\"}","time":"%s","hostname":"test","message":"%s"}\n' \
    "$(date -v"$1" '+%Y-%m-%dT%H:%M:%S.000%z')" "$2"
}

run_watchdog() { # run_watchdog <case-dir>  (expects <case-dir>/logs prepared)
  local dir="$1"
  SLW_LOG_DIR="$dir/logs" \
  SLW_STATE_FILE="$dir/state" \
  SLW_DECISION_LOG="$dir/decisions.log" \
  SLW_RESTART_CMD="echo restarted >> '$dir/restarts'" \
    "$WATCHDOG"
  sleep 0.3 # detached restart stub is backgrounded
}

restart_count() { wc -l < "$1/restarts" 2>/dev/null | tr -d ' ' || echo 0; }

# --- Case 1: Aug-4 signature — >=3 disconnect flaps in-window -> restart ---
d="$TMP/flaps"; mkdir -p "$d/logs"
{ line -40M "$FLAP"; line -25M "$FLAP"; line -10M "$FLAP"; line -5M "$FLAP"; } \
  > "$d/logs/openclaw-fixture.log"
run_watchdog "$d"
check "flaps>=3 triggers restart" [ "$(restart_count "$d")" = 1 ]
check "flaps>=3 logs trigger with counts" grep -q 'triggered: flaps=4 maxconn=0' "$d/decisions.log"

# --- Case 2: Aug-3 variant — 1 flap + 2 active connections -> restart ---
d="$TMP/conns"; mkdir -p "$d/logs"
{ line -20M "$FLAP"; line -15M "$CONN2"; } > "$d/logs/openclaw-fixture.log"
run_watchdog "$d"
check "flaps=1 + maxconn=2 triggers restart" [ "$(restart_count "$d")" = 1 ]
check "conn variant logs counts" grep -q 'triggered: flaps=1 maxconn=2' "$d/decisions.log"

# --- Case 3: healthy — signatures only outside window, stopped line inside -> no restart ---
d="$TMP/healthy"; mkdir -p "$d/logs"
{ line -300M "$FLAP"; line -290M "$FLAP"; line -280M "$FLAP"; line -280M "$CONN2"
  line -10M "$STOPPED"; line -5M "slack socket mode connected"; } \
  > "$d/logs/openclaw-fixture.log"
run_watchdog "$d"
check "healthy log exits 0 (run_watchdog uses set -e)" true
check "healthy log performs no restart" [ ! -e "$d/restarts" ]
check "healthy log records checked decision" grep -q 'checked: flaps=0 maxconn=0' "$d/decisions.log"

# --- Case 4: cooldown — second triggering run within 60 min skips restart ---
d="$TMP/cooldown"; mkdir -p "$d/logs"
{ line -30M "$FLAP"; line -20M "$FLAP"; line -10M "$FLAP"; } > "$d/logs/openclaw-fixture.log"
run_watchdog "$d"
run_watchdog "$d"
check "cooldown allows at most one restart" [ "$(restart_count "$d")" = 1 ]
check "cooldown skip is logged" grep -q 'cooldown-skip' "$d/decisions.log"

# --- Case 5: no gateway log at all -> quiet exit 0 ---
d="$TMP/nolog"; mkdir -p "$d/logs"
run_watchdog "$d"
check "missing log exits 0 without restart" [ ! -e "$d/restarts" ]

# --- Case 6: newest-by-mtime resolution, not date in filename ---
d="$TMP/newest"; mkdir -p "$d/logs"
{ line -10M "$FLAP"; line -8M "$FLAP"; line -6M "$FLAP"; } > "$d/logs/openclaw-2001-01-01.log"
line -5M "slack socket mode connected" > "$d/logs/openclaw-2099-12-31.log"
touch -t 202601010000 "$d/logs/openclaw-2099-12-31.log" # future-dated name, old mtime
run_watchdog "$d"
check "newest log by mtime is scanned" [ "$(restart_count "$d")" = 1 ]

echo
if [ "$fails" -gt 0 ]; then echo "$fails test(s) FAILED"; exit 1; fi
echo "all tests passed"
