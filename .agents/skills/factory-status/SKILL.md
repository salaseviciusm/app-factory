---
name: factory-status
description: View the status of App Factory orchestration, active and recent runs, step progress, cost/token usage, telemetry digest, executor health, and OpenClaw gateway/Slack connectivity. Use when asked for factory status, run status, orchestration health, what the factory is working on, or run costs.
---

# Factory orchestration status

All commands are read-only. Engine path: `~/src/app-factory/orchestration/bin/factory-run`.

## Runs

```bash
factory-run list                # all runs, newest first, with state + cost/tokens
factory-run status <run_id>     # one run: step history, cost, worktree, run dir
```

States: `queued`, `running:<step>`, `awaiting-approval` (plan discussion awaiting
the founder's next message or go-ahead in #factory-builds), `approved`, `done`,
`killed` (founder said don't build — a success, not a failure), `failed`,
`cancelled`.

## Telemetry digest

```bash
factory-run report [--days N] [--json]
```

Totals, per-run cost/tokens, per-step failure/duration/cost stats, recent
review findings, recent artifacts (commits, deploy URLs, merge commits).

## Executor health

Runs execute in detached processes. To verify an in-flight run is alive:

```bash
ps aux | grep "factory-run exec" | grep -v grep
```

If a run shows `running:*` but has no executor process, restart it with
`factory-run resume <run_id>`. For a failed or stuck step, read
`~/src/app-factory/orchestration/runs/<run_id>/engine.log` and the failing
step's `<step>.log` in the same directory.

## Gateway / Slack health

```bash
openclaw gateway status         # service up, port, log file path
openclaw channels status        # Slack connected + healthy
```

Caution: channel status can read "connected, healthy" while inbound events are
silently lost (zombie Socket Mode connections). The trustworthy signal is
recent `Inbound` lines in `/tmp/openclaw/openclaw-<date>.log`; a full
`openclaw gateway restart` recovers the zombie state.

## Reporting format

Summarize as: active runs (id, rig, current step, how long), anything awaiting
approval, recent completions/failures with one-line causes, and total recent
cost if asked. Don't dump raw command output.
