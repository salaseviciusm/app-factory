---
name: factory-feature
description: Start, steer, approve, and report orchestrated feature-dev and bug-fix runs on registered rigs (running-with-pace, skip-hero, factory apps) via the factory-run engine. Use when the founder asks for a new feature, a bug fix, a deploy/build of one, or the status of runs. Works from typed or voice-note messages.
user-invocable: true
---

# Orchestrated Runs (feature-dev / bug-fix)

You drive the run engine at `~/src/app-factory/orchestration/bin/factory-run`.
It executes the workflow (plan → founder gate → implement → deterministic checks →
cross-model review → tests → EAS deploy → Slack notify with QR/link) in a detached
process; you start it, relay the plan, record the founder's decision, and answer
status questions. The engine posts step transitions to #factory-builds on its own.

## Rigs

- `running-with-pace`, `skip-hero`: production tier, high standards (full check +
  review + test loop, EAS preview update at the end).
- `factory:<app>` (for example `factory:pullup`): quickfire idea apps under
  `~/src/app-factory/apps/` — template checks only, no deploy until EAS is set up.

If the founder does not name a rig, ask which one (one short question). Map
casual names: "pace"/"running app" → running-with-pace; "skip"/"skipping" → skip-hero.

## Verbs

Start a feature (the founder describes what they want, typed or voice):

```sh
~/src/app-factory/orchestration/bin/factory-run start \
  --rig <rig> --workflow feature-dev --prompt "<the founder's request, faithfully restated>"
```

Start a bug fix: same, with `--workflow bug-fix`.

The command prints a run id and returns immediately. Tell the founder the run id
and that the plan will arrive shortly for approval.

Plan gate: the engine posts the plan to #factory-builds and waits. When the founder
says "approve"/"go"/"looks good" (in any channel, referring to the run):

```sh
~/src/app-factory/orchestration/bin/factory-run approve <run_id>
```

Rejection or changes requested:

```sh
~/src/app-factory/orchestration/bin/factory-run reject <run_id> "<their feedback>"
```

Mid-run steering ("also make it work offline", "use the green accent"):

```sh
~/src/app-factory/orchestration/bin/factory-run steer <run_id> "<instruction>"
```

Status (also fold into standup when runs are active):

```sh
~/src/app-factory/orchestration/bin/factory-run status            # all runs
~/src/app-factory/orchestration/bin/factory-run status <run_id>   # one run, with history
```

Cancel: `factory-run cancel <run_id>`.

## Conduct

- Restate the founder's request faithfully in `--prompt`; do not embellish scope.
  For voice notes, use the transcript; if the transcript is garbled on a key point,
  ask one clarifying question before starting.
- If the founder says "just do it"/"no need to check the plan", add `--auto` to skip
  the plan gate. Otherwise never skip it.
- When a run finishes, the engine posts the artifact link + QR code itself. Your job
  afterwards: offer to merge (`git -C <rig path> merge factory/<run_id>`) once the
  founder confirms the build works on their device. Never merge unprompted.
- On failures, read `~/src/app-factory/orchestration/runs/<run_id>/engine.log` and the
  failing step log, summarize the cause in one or two sentences, and propose the next
  action (retry, steer, or drop).
- Update STATE.md when runs start and land, per your chief-of-staff duties.
