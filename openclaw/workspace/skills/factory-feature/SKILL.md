---
name: factory-feature
description: Start, steer, approve, and report orchestrated feature-dev and bug-fix runs on registered rigs (running-with-pace, skip-hero, factory apps) via the factory-run engine. Use when the founder asks for a new feature, a bug fix, a deploy/build of one, or the status of runs. Works from typed or voice-note messages.
user-invocable: true
---

# Orchestrated Runs (feature-dev / bug-fix)

You drive the run engine at `~/src/app-factory/orchestration/bin/factory-run`.
It executes the workflow (plan → founder plan discussion → implement → deterministic checks →
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

Run ids are readable task slugs derived from the prompt (`feature-version-badge`,
`bug-leaked-sockets`), and every verb below accepts any unambiguous prefix or
fragment of an id — so when the founder says "approve the version badge run" you
can pass `version-badge` directly without looking up the exact id. On an
ambiguous fragment the command exits non-zero listing the matching ids; pick the
right one and rerun. Older runs keep their legacy `feature-msdn5cuj`-style ids
and resolve the same way.

Plan discussion (feature-dev): the engine posts the plan to #factory-builds as a
conversation, not a one-shot gate. The founder can ask questions or request
changes as many times as they like (up to 8 turns); each reply gets a real
answer and the plan file is rewritten to match before implementation starts.
Relay the founder's message verbatim-in-substance:

```sh
~/src/app-factory/orchestration/bin/factory-run reply <run_id> "<their message>"
```

Only the founder ends the discussion. Go-ahead ("approve"/"go"/"looks good", in
any channel, referring to the run):

```sh
~/src/app-factory/orchestration/bin/factory-run approve <run_id>
```

Drop the feature entirely:

```sh
~/src/app-factory/orchestration/bin/factory-run reject <run_id> "<their feedback>"
```

Use `reject` only for "don't build this" — it ends the run. Anything of the form
"yes but change X" is a `reply`, which keeps the discussion alive. Bug-fix runs
have no discussion; they proceed straight to implementation.

Mid-run steering ("also make it work offline", "use the green accent"):

```sh
~/src/app-factory/orchestration/bin/factory-run steer <run_id> "<instruction>"
```

Status (also fold into standup when runs are active):

```sh
~/src/app-factory/orchestration/bin/factory-run status            # all runs
~/src/app-factory/orchestration/bin/factory-run status <run_id>   # one run, with history
~/src/app-factory/orchestration/bin/factory-run report --days 7   # cost/token totals for tuning
```

Every run's status (and the engine's own end-of-run Slack message) now carries a
cost/token line — `Cost $X · tokens in N (M cached) / out K · S agent step(s)`.
Relay it verbatim when reporting status; for "how much are we spending / which
step costs most", run `report` (grand total + per-run + per-step cost).

Cancel: `factory-run cancel <run_id>`.

## Conduct

- Restate the founder's request faithfully in `--prompt`; do not embellish scope.
  For voice notes, use the transcript; if the transcript is garbled on a key point,
  ask one clarifying question before starting.
- If the founder says "just do it"/"no need to check the plan", add `--auto` to skip
  the plan discussion. Otherwise never skip it.
- When a run finishes, the engine posts the artifact link + QR code itself. Your job
  afterwards: offer to merge (`git -C <rig path> merge factory/<run_id>`) once the
  founder confirms the build works on their device. Never merge unprompted.
- On failures, read `~/src/app-factory/orchestration/runs/<run_id>/engine.log` and the
  failing step log, summarize the cause in one or two sentences, and propose the next
  action (retry, steer, or drop).
- Keep STATE.md's narrative current (phase, active apps, plans) per your
  chief-of-staff duties — but do not duplicate run or gate status into it;
  `factory-run status` is the authority on runs, gates, and costs.
