---
name: factory-self-review
description: Kick off the App Factory self-evaluation loop, which analyzes run telemetry (costs, failures, review findings, durations), writes an improvement plan, gates on founder approval, then spawns a feature-dev run to implement the improvement in the factory harness. Use when asked to run a factory self-review, self-improvement cycle, or analyze factory performance.
---

# Factory self-review run

Workflow: analyze telemetry → founder plan gate → spawn a feature-dev run on the
`app-factory` rig that implements, validates, and deploys the improvement
(harness-merge: merges to local main and restarts the OpenClaw gateway).
Runs on the live checkout (read-only analyze step, no worktree).

## Start

```bash
~/src/app-factory/orchestration/bin/factory-run start \
  --rig app-factory --workflow self-review \
  --prompt "<focus for this review, e.g. 'examine last week's runs, focus on cost and failure loops'>"
```

Prints a run id. The improvement plan lands in the #factory-builds Slack channel
for founder approval; `factory-run approve <run_id>` records it and the spawned
feature-dev run proceeds automatically (auto-approved plan).

## Inspect telemetry directly

```bash
~/src/app-factory/orchestration/bin/factory-run report [--days N] [--json]
```

Shows totals, per-run cost/tokens, step failure/duration/cost stats, recent
review findings and artifacts from `orchestration/telemetry.db`.

## Notes

- A weekly cron already runs this (Sundays 17:00); manual runs are for on-demand
  analysis.
- Before approving a plan, ensure the app-factory checkout has no uncommitted
  changes to files the improvement will touch — the spawned run's harness-merge
  deploy merges into local main.
