#!/usr/bin/env bash
# Reconciles factory run state against reality, on a schedule (launchd, every 30m).
#
# Four passes, cheapest first — all deterministic, no agent/model cost:
#   1. sync    — every `awaiting-merge` run against its GitHub PR, so runs the
#                founder merged on github.com flip to done without being asked.
#  1b. harness-restart — apply harness restarts sync deferred (D35: sync only
#                restarts an idle gateway). launchd runs outside the gateway's
#                process tree, so this pass is never killed by its own restart;
#                it never forces one either (busy/hold → defer, 24h escalation).
#   2. cleanup — reclaim worktrees/branches of terminal runs (never forced: dirty
#                or unmerged trees, and merged-PR branches whose tip diverged
#                from the PR head, are skipped with a reason; `--discard` is
#                founder-only and deliberately not used here).
#   3. watchdog — the stale-run alert pass, which had no schedule of its own.
#
# Slack notification is factory-run's own job (sync posts the :tada: merge line,
# watchdog posts the :hourglass: stale line, deduped via runs/<id>/watchdog.json).
# This script stays silent unless something changed, so the log is a signal.
#
# launchd — NOT openclaw cron — for the same reason as setup-watchdog.sh: this
# must keep working when the agent process is wedged, and it costs no tokens.
#
# Manual run:  openclaw/factory-reconcile.sh            (or --dry-run)
set -uo pipefail

ORCH="$HOME/src/app-factory/orchestration"
RUN="$ORCH/bin/factory-run"
DRY=""
[ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

ts() { date -u "+%Y-%m-%dT%H:%M:%SZ"; }
say() { echo "[$(ts)] $*"; }

[ -x "$RUN" ] || { say "ERROR: $RUN not executable"; exit 1; }

# --- 1. sync every awaiting-merge run -------------------------------------
# `factory-run sync` takes exactly one run id (no --all), so enumerate. A run
# whose sync refuses (no PR recorded — local-merge rigs) is reported once and
# left alone; forcing it is a founder decision.
ids="$("$RUN" list --json 2>/dev/null | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  try { for (const r of JSON.parse(s)) if (r.state === "awaiting-merge") console.log(r.id); }
  catch { process.exit(0); }
});')"

synced=0
if [ -n "$ids" ]; then
  while IFS= read -r id; do
    [ -n "$id" ] || continue
    if [ -n "$DRY" ]; then
      say "would sync $id"
      continue
    fi
    out="$("$RUN" sync "$id" 2>&1)"
    rc=$?
    # "still open" is the steady state and not worth a log line every 30m.
    case "$out" in
      *"still open"*) ;;
      *) say "sync $id (rc=$rc): $out"; synced=$((synced + 1)) ;;
    esac
  done <<< "$ids"
fi

# --- 1b. deferred harness restarts ----------------------------------------
# After sync, so a merge sync just deferred is picked up in the same pass.
# "nothing pending" is the steady state and not worth a log line every 30m.
hr_out="$("$RUN" harness-restart $DRY 2>&1 | grep -v '^harness-restart: nothing pending$')"
[ -n "$hr_out" ] && { say "harness-restart:"; echo "$hr_out"; }

# --- 2. cleanup ------------------------------------------------------------
cleanup_out="$("$RUN" cleanup $DRY 2>&1 | grep -Ev ': nothing to clean$|is not terminal$')"
if [ -n "$(echo "$cleanup_out" | grep -Ev '^\s*$|^(would free|freed) 0 B')" ]; then
  say "cleanup:"
  echo "$cleanup_out"
fi

# --- 3. stale-run watchdog -------------------------------------------------
watchdog_out="$("$RUN" watchdog $DRY 2>&1 | grep -v '^no stale runs$')"
[ -n "$watchdog_out" ] && { say "watchdog:"; echo "$watchdog_out"; }

exit 0
