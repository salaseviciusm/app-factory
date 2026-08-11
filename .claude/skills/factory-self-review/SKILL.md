---
name: factory-self-review
description: Kick off the App Factory self-evaluation loop, which analyzes run telemetry (costs, failures, review findings, durations), writes an improvement plan, gates on founder approval, then spawns a feature-dev run to implement the improvement in the factory harness. Use when asked to run a factory self-review, self-improvement cycle, or analyze factory performance.
---

# Factory self-review run

Workflow: analyze telemetry → founder plan gate → spawn a feature-dev run on the
`app-factory` rig that implements, validates, and opens a PR for the
improvement (the run parks `awaiting-merge`; after the founder merges the PR,
`factory-run sync <run_id>` restarts the OpenClaw gateway/web console so the
improvement goes live). Runs on the live checkout (read-only analyze step, no
worktree).

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
- The spawned run ends at an open PR (state `awaiting-merge`). Merge it on
  GitHub, then `factory-run sync <child_run_id>` — that is what restarts the
  gateway/web console (after verifying the local checkout contains the merge;
  pull first if it doesn't).
