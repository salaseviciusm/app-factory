---
name: factory-feature-dev
description: Kick off an orchestrated feature-dev run on an App Factory rig (running-with-pace, skip-hero, app-factory, or a factory:<app> quickfire app) via the factory-run engine. Use when asked to start a factory feature run, build a feature through the app factory pipeline, or ship a feature with plan/review/deploy automation.
---

# Factory feature-dev run

Starts the full pipeline: plan → founder gate → implement → deterministic checks →
cross-model review → tests → deploy → Slack notify. Runs detached in an isolated
git worktree on branch `factory/<run-id>`; main checkouts are never touched.

## Start

```bash
~/src/app-factory/orchestration/bin/factory-run start \
  --rig <rig> --workflow feature-dev --prompt "<the request, faithfully restated>"
```

Rigs: `running-with-pace`, `skip-hero` (production tier: full checks + review +
tests + EAS preview deploy), `app-factory` (the factory harness itself; deploy
merges to local main and restarts the OpenClaw gateway), `factory:<app>`
(quickfire apps under `apps/`, template checks only).

Prints a run id and returns immediately. Add `--auto` only if the founder
explicitly waived plan approval.

## Gates and control

The engine posts the plan to the #factory-builds Slack channel and waits.

```bash
factory-run approve <run_id>            # founder approved the plan
factory-run reject <run_id> "<feedback>" # replan with feedback
factory-run steer <run_id> "<instruction>" # mid-run steering
factory-run status [<run_id>]           # state, history, cost/tokens
factory-run resume <run_id>             # restart a dead executor at current step
```

(Full path: `~/src/app-factory/orchestration/bin/factory-run`.)

## Notes

- The engine posts every step transition and the final artifact link/QR to Slack
  itself; do not duplicate those notifications.
- On failure, read `~/src/app-factory/orchestration/runs/<run_id>/engine.log`
  and the failing step's log, then summarize the cause before proposing retry.
- Completed work stays on branch `factory/<run_id>` with the worktree kept;
  merging into the rig's main branch is a human decision.
