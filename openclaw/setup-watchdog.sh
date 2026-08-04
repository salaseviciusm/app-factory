#!/usr/bin/env bash
# Installs the Slack connectivity watchdog (watchdog.mjs) as a launchd LaunchAgent.
# launchd — NOT openclaw cron — because a watchdog scheduled by the process it
# watches can't recover that process when it's wedged (the 2026-08-04 incident).
#
# Idempotent: re-running replaces the LaunchAgent in place (bootout + bootstrap).
# Uninstall: setup-watchdog.sh --uninstall
#
# Prereqs (README Step 5c): the dedicated quiet probe channel exists, the bot is
# invited, and FACTORY_WATCHDOG_CHANNEL is filled in openclaw/secrets.env.
set -euo pipefail

LABEL="com.appfactory.openclaw-watchdog"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WATCHDOG="$SCRIPT_DIR/watchdog.mjs"
UID_NUM="$(id -u)"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Watchdog LaunchAgent removed ($LABEL)."
  exit 0
fi

NODE_BIN="$(command -v node || true)"
[ -n "$NODE_BIN" ] || { echo "ERROR: node not found in PATH" >&2; exit 1; }
OPENCLAW_BIN="$(command -v openclaw || true)"
[ -n "$OPENCLAW_BIN" ] || { echo "ERROR: openclaw CLI not found in PATH" >&2; exit 1; }

# Fail fast on configuration (exit 2 = a FACTORY_* variable is missing) before
# installing anything. Other non-zero exits (unhealthy/outage) are exactly what
# the watchdog exists to handle, so they don't block the install.
echo "Running a one-off health check (watchdog.mjs --check-only)…"
rc=0
"$NODE_BIN" "$WATCHDOG" --check-only < /dev/null || rc=$?
if [ "$rc" -eq 2 ]; then
  echo "ERROR: watchdog configuration incomplete (see message above) — fill openclaw/secrets.env first." >&2
  exit 2
elif [ "$rc" -ne 0 ]; then
  echo "WARNING: check-only exited $rc (unhealthy/outage) — installing anyway; the scheduled watchdog will handle it." >&2
fi

mkdir -p "$HOME/Library/LaunchAgents" /tmp/openclaw

# PATH for the job: node + openclaw dirs (launchd jobs don't inherit a shell PATH).
JOB_PATH="$(dirname "$NODE_BIN"):$(dirname "$OPENCLAW_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$WATCHDOG</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/tmp/openclaw/watchdog-launchd.out.log</string>
  <key>StandardErrorPath</key><string>/tmp/openclaw/watchdog-launchd.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$JOB_PATH</string>
  </dict>
</dict>
</plist>
EOF

# Replace any existing instance, then load the fresh one (idempotent re-run).
launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$PLIST"

if launchctl print "gui/$UID_NUM/$LABEL" > /dev/null 2>&1; then
  echo "Watchdog installed: $LABEL (every 300s)."
  echo "  decisions: tail -f /tmp/openclaw/watchdog.log"
  echo "  manual check: node $WATCHDOG --check-only"
  echo "  uninstall: $0 --uninstall"
else
  echo "ERROR: LaunchAgent did not load — inspect: launchctl print gui/$UID_NUM/$LABEL" >&2
  exit 1
fi
