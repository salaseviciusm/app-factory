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
   (cost/tokens), a `consoleUrl` (the run's web-console deep link), and — for runs
   in state `awaiting-approval` — a `gate` object (`kind`: `plan-gate` or
   `discussion`, plus `pendingReplies` and `lastActivityAt`).
   - **Linking runs**: every run you mention in the standup is a Slack mrkdwn link
     using its `consoleUrl` from `status --json` — `<consoleUrl|run <id>>` — so the
     founder can tap straight into the run page from his phone. Never paste a bare
     run id where a link would do, and never hand-build console URLs.
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
     into main when happy (local merge — the engine never pushes the base
     branch)". Never report awaiting-merge as stalled or failed.
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
2. Open PRs across all rigs:
   `~/src/app-factory/orchestration/bin/factory-run prs --json`. One entry per open
   non-draft PR: `{rig, number, title, url, createdAt, ageDays, attention, checks}`,
   where `attention` is `approved-mergeable`, `review-requested`, `failing-checks`,
   or `none`. A per-rig `{rig, error}` entry means the listing failed for that rig —
   say so rather than claiming zero PRs there. This feed is the authority on PRs
   waiting for the founder; never shell out to `gh` yourself.
3. `~/src/app-factory/STATE.md` — narrative only: current phase, active apps and their
   stages, yesterday's plan. Do not source run states, pending gates, or costs from it;
   the engine (step 1) is the authority on those.
4. Per active app: `apps/<name>/STATUS.md` (stage, in-flight tasks, blockers) and
   recent git log in its workspace.
5. Portfolio pulse (only once analytics exist — Phase 3+): last nightly digest.
6. Yesterday's standup thread: which proposals were adjusted, which proceeded by cutoff.
7. **Introspection evidence** — `factory-run report --days 7 --json` plus yesterday's
   run dirs. You are looking for ONE thing worth changing about the pipeline itself:
   - a step that failed, timed out, retried, or burned unusual cost (`factory-run
     context <id>`);
   - a review loop that needed more than one cycle, and what the findings were about;
   - a gate that sat waiting on the founder longer than it should have;
   - work that was done by hand in a chat thread that a run should have done;
   - a repeated manual step that a new workflow or rig would absorb.

## Compose — exactly these five sections

**Yesterday** — per app, what actually landed (merged/reviewed/green), what stalled and
why. Only claims you can point to evidence for (a commit, a review, a check run). If a
task was planned and didn't happen, say so plainly.

**Portfolio pulse** — installs/revenue/notable movement. Until analytics exist, write
"Not yet wired (Phase 3)."

**Today's proposal** — the task allocation you intend: per task, which profile, which
app, definition of done. Keep it to what can genuinely finish today. Apply org
restraint: no task gets a specialist that two tool calls could finish.

**Factory introspection** — two or three lines, never more. The pipeline looking at
itself: what yesterday's runs say about the harness, and the single highest-leverage
change you'd make to it. Format:

- _Observed_: one sentence with the evidence (run id, step, cost, cycle count).
- _Change_: the one concrete improvement — a workflow/rig/check/prompt change, a new
  workflow, or a skill that should exist. Cheapest viable version first.
- _Cost to try_: rough, and whether it needs a self-review run or is a two-minute edit.

Rules: evidence or silence — if yesterday genuinely showed nothing, write "Nothing new;
last open item is <X>" and move on. Never repeat a suggestion the founder already
declined (check the decision log). Don't start the change — it goes to "Needs founder"
as a yes/no if it's worth more than a two-minute edit, and to `factory-self-review` if
the founder says yes. Once a week (or when the item is big) the answer is "run
self-review on it" rather than an inline fix.

**Needs founder** — pending gates, pending merges (with branch names), held deploys,
an "Open PRs" list, and up to 3 decision-shaped questions, each with your recommended
default so a one-word reply resolves it. The introspection change, if it needs a yes,
is one of them.

- **Open PRs** (from `factory-run prs --json`): one line per PR — the title as a
  Slack link to its `url` (`<url|title (#number)>`), then its attention state
  (`approved-mergeable` = "merge when happy", `review-requested` = "awaiting your
  review", `failing-checks` = "checks failing"), age (`ageDays`), and check status
  (`checks`). Order by attention urgency, then age. PRs with attention `none` are
  omitted unless nothing else is open; a rig's `error` entry gets one honest line.
  Where a PR belongs to a run you already listed (pending merge), fold the link
  into that line instead of repeating it.

## After posting

- Reply-watch until 11:00: founder replies re-plan the day (acknowledge + restate the
  changed plan in one message). No reply by 11:00 → proceed with the posted proposal.
- Write the day's plan into `STATE.md` under "Today" with a timestamp.
- If the founder accepts (or declines) the introspection change, record it with
  `factory-record-decision` — that log is what stops you re-proposing it next week and
  is the backlog `factory-self-review` reads from.
- Founder messages at ANY other time also re-plan — the standup is the scheduled
  steering point, not the only one.
