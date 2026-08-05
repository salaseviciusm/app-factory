---
name: factory-standup
description: Prepare and post the App Factory daily standup to the #factory-standup Slack channel. Run by cron at 08:00 or on demand ("run standup").
user-invocable: true
---

# Daily Standup

Produce ONE message (threaded sections welcome) for `#factory-standup`. This is the
founder's 30-second read — outcome-first, complete sentences, no jargon.

## Gather (in order)

1. Runs, gates, costs — from the engine, never from STATE.md:
   `~/src/app-factory/orchestration/bin/factory-run status --json`. Every run carries
   its `state`, a `currentStep` (`{index, total, id, type}`), per-run `usage`
   (cost/tokens), and — for runs in state `awaiting-approval` — a `gate` object
   (`kind`: `plan-gate` or `discussion`, plus `pendingReplies` and `lastActivityAt`).
   - **Pending gates** = every run in state `awaiting-approval`. A run in a
     discussion step awaiting a founder reply IS a pending gate — surface it in
     "Needs founder" exactly like a plan gate, with how long it has been waiting
     (`gate.lastActivityAt`). The `gate.kind` distinguishes a `plan-gate`, a
     `preview-gate` (a published preview waiting for the founder to try it —
     include the preview URL from the run's `preview` object), and a `discussion`.
   - **Pending merges** = every run in state `awaiting-merge`. These runs finished
     GREEN — the rig's merge policy is "review", so the founder merges by hand.
     List each in "Needs founder" with the branch from the run's machine-readable
     `pendingMerge` object (`{branch, baseBranch}`), e.g. "merge `factory/<id>`
     into main when happy (local merge only — the engine never pushes)". Never
     report awaiting-merge as stalled or failed.
   - **Held deploys** = every run with `deployHeld: true` (the rig's deploy policy
     is "hold"). List in "Needs founder": release with `factory-run deploy <id>`
     or the console's Release-deploy button.
   - **Yesterday's completions** = runs that reached a terminal state since the last
     standup. `done` landed. `killed` is ALSO a completed success — the founder ended
     a spec discussion with "don't build"; an early kill is money saved. Never report
     `killed` as a failure. `awaiting-merge` is a completed success still holding a
     founder action (the merge). `failed` / `rejected` / `cancelled` are the
     didn't-land bucket; give each its one-line cause.
   - **Costs**: per-run `usage` from `status --json`; for aggregates (yesterday's or
     the week's spend) use `factory-run report --days N --json` (telemetry-db digest).
2. `~/src/app-factory/STATE.md` — narrative only: current phase, active apps and their
   stages, yesterday's plan. Do not source run states, pending gates, or costs from it;
   the engine (step 1) is the authority on those.
3. Per active app: `apps/<name>/STATUS.md` (stage, in-flight tasks, blockers) and
   recent git log in its workspace.
4. Portfolio pulse (only once analytics exist — Phase 3+): last nightly digest.
5. Yesterday's standup thread: which proposals were adjusted, which proceeded by cutoff.

## Compose — exactly these four sections

**Yesterday** — per app, what actually landed (merged/reviewed/green), what stalled and
why. Only claims you can point to evidence for (a commit, a review, a check run). If a
task was planned and didn't happen, say so plainly.

**Portfolio pulse** — installs/revenue/notable movement. Until analytics exist, write
"Not yet wired (Phase 3)."

**Today's proposal** — the task allocation you intend: per task, which profile, which
app, definition of done. Keep it to what can genuinely finish today. Apply org
restraint: no task gets a specialist that two tool calls could finish.

**Needs founder** — pending gates, pending merges (with branch names), held deploys,
and up to 3 decision-shaped questions, each with your recommended default so a
one-word reply resolves it.

## After posting

- Reply-watch until 11:00: founder replies re-plan the day (acknowledge + restate the
  changed plan in one message). No reply by 11:00 → proceed with the posted proposal.
- Write the day's plan into `STATE.md` under "Today" with a timestamp.
- Founder messages at ANY other time also re-plan — the standup is the scheduled
  steering point, not the only one.
