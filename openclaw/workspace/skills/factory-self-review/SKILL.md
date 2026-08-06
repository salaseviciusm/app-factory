---
name: factory-self-review
description: Run the factory's self-evaluation loop - analyze telemetry from past orchestrated runs (step outcomes, review findings, artifacts), produce an improvement plan for the harness, discuss it with the founder in Slack, and on approval spawn a feature-dev run on the app-factory rig that implements, validates, and merges the improvement live. Use when the founder asks to improve the factory, review how runs went, or when the weekly self-review cron fires.
user-invocable: true
---

# Factory Self-Review (the harness improves itself)

The self-review workflow makes the factory better using evidence, not vibes: run
telemetry lives in `orchestration/telemetry.db` (SQLite - commits, artifact links,
review verdicts, step durations; never raw context dumps).

## Start a review

```sh
~/src/app-factory/orchestration/bin/factory-run start \
  --rig app-factory --workflow self-review \
  --prompt "<founder's focus, or: periodic self-review - find the highest-leverage harness improvement>"
```

The analyze node starts from `docs/process/harness-backlog.md` — the ranked
harness-improvement backlog the `factory-retro` workflow maintains from weekly
run evidence (open items first; `declined` items are off the table) — then
reads the telemetry report + run dirs + the harness source and writes an
improvement plan (ONE concrete change + backlog). The engine posts the plan to
#factory-builds and waits at the gate.

## The founder conversation (your main job)

When the plan lands in Slack, the founder will discuss it with you. Answer from
the plan file (`orchestration/runs/<run_id>/improvement-plan.md`) and the report
(`factory-run report --days 30`). Adjust course with:

```sh
~/src/app-factory/orchestration/bin/factory-run steer <run_id> "<changes the founder wants>"
~/src/app-factory/orchestration/bin/factory-run reject <run_id> "<feedback>"   # re-plan needed
~/src/app-factory/orchestration/bin/factory-run approve <run_id>               # founder confirmed
```

On approval the run SPAWNS a full feature-dev graph execution (child run) on the
`app-factory` rig with the plan as its feature request. The child run implements,
passes deterministic checks (engine syntax + selftest + script lint), passes
cross-model review, and then **harness-merge deploys**: merges to main and
restarts the gateway. The factory is live-updated.

## Cautions

- The spawned child run is auto-approved by design (the founder already approved
  the plan at the self-review gate). Its validation loop still applies.
- Harness-merge requires app-factory main to be committed clean enough to merge;
  if the merge fails it aborts safely and the run fails with the reason.
- Rollback of a bad self-improvement: `git -C ~/src/app-factory revert -m 1 <merge_sha>`
  then `openclaw gateway restart` (the merge commit sha is in the run's Slack post).
- Quick health queries anytime: `factory-run report --days 30` (add `--json` for data).
