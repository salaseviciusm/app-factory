#!/usr/bin/env bash
# Installs factory-reconcile.sh as a launchd LaunchAgent (every 30 minutes).
#
# Why launchd and not `openclaw cron`: the reconcile pass is deterministic
# shell + git + gh. Waking the agent for it would cost tokens on every tick and
# would stop working exactly when the agent is wedged — the same reasoning as
# setup-watchdog.sh (the 2026-08-04 incident).
#
# Idempotent: re-running replaces the LaunchAgent in place (bootout + bootstrap).
# Uninstall: setup-reconcile.sh --uninstall
set -euo pipefail

LABEL="com.appfactory.factory-reconcile"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RECONCILE="$SCRIPT_DIR/factory-reconcile.sh"
UID_NUM="$(id -u)"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Reconcile LaunchAgent removed ($LABEL)."
  exit 0
fi

chmod +x "$RECONCILE"

NODE_BIN="$(command -v node || true)"
[ -n "$NODE_BIN" ] || { echo "ERROR: node not found in PATH" >&2; exit 1; }
GH_BIN="$(command -v gh || true)"
[ -n "$GH_BIN" ] || { echo "ERROR: gh not found in PATH (sync needs it)" >&2; exit 1; }
GIT_BIN="$(command -v git)"

echo "Running a one-off dry pass…"
"$RECONCILE" --dry-run < /dev/null || { echo "ERROR: dry pass failed" >&2; exit 1; }

mkdir -p "$HOME/Library/LaunchAgents" /tmp/openclaw

# launchd jobs don't inherit a shell PATH; sync shells out to gh and git.
JOB_PATH="$(dirname "$NODE_BIN"):$(dirname "$GH_BIN"):$(dirname "$GIT_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$RECONCILE</string>
  </array>
  <key>StartInterval</key><integer>1800</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/tmp/openclaw/factory-reconcile.log</string>
  <key>StandardErrorPath</key><string>/tmp/openclaw/factory-reconcile.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$JOB_PATH</string>
    <key>HOME</key><string>$HOME</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$PLIST"

if launchctl print "gui/$UID_NUM/$LABEL" > /dev/null 2>&1; then
  echo "Reconcile installed: $LABEL (every 1800s)."
  echo "  log: tail -f /tmp/openclaw/factory-reconcile.log"
  echo "  manual: $RECONCILE"
  echo "  uninstall: $0 --uninstall"
else
  echo "ERROR: LaunchAgent did not load — inspect: launchctl print gui/$UID_NUM/$LABEL" >&2
  exit 1
fi
