---
name: factory-bug-fix
description: Kick off an orchestrated bug-fix run on an App Factory rig (running-with-pace, skip-hero, app-factory, or a factory:<app> quickfire app) via the factory-run engine. Use when asked to start a factory bug-fix run or fix a bug through the app factory pipeline with automated find/fix/review/deploy.
---

# Factory bug-fix run

Pipeline: find the bug → implement a fix → deterministic checks → cross-model
review → tests → deploy → Slack notify. No plan gate: the run proceeds
end-to-end once started. Runs detached in an isolated git worktree on branch
`factory/<run-id>`.

## Start

```bash
~/src/app-factory/orchestration/bin/factory-run start \
  --rig <rig> --workflow bug-fix --prompt "<bug report: symptom, where seen, repro if known>"
```

Rigs: `running-with-pace`, `skip-hero`, `app-factory` (harness itself; deploy
merges to local main and restarts the OpenClaw gateway), `factory:<app>`.

Give the bug-finder evidence, not a diagnosis: exact error text, logs or log
paths, when it started, what changed. Prints a run id and returns immediately.

## Control

```bash
factory-run status [<run_id>]              # state, history, cost/tokens
factory-run steer <run_id> "<instruction>" # mid-run steering
factory-run cancel <run_id>
factory-run resume <run_id>                # restart a dead executor
```

(Full path: `~/src/app-factory/orchestration/bin/factory-run`.)

## Notes

- The engine posts step transitions and results to the #factory-builds Slack
  channel itself.
- On failure, read `~/src/app-factory/orchestration/runs/<run_id>/engine.log`
  and the failing step's log.
- The fix lands on branch `factory/<run_id>`; merging is a human decision
  (except the app-factory rig, which self-merges on successful deploy).
