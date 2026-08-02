---
name: factory-standup
description: Prepare and post the App Factory daily standup to the #factory-standup Slack channel. Run by cron at 08:00 or on demand ("run standup").
user-invocable: true
---

# Daily Standup

Produce ONE message (threaded sections welcome) for `#factory-standup`. This is the
founder's 30-second read — outcome-first, complete sentences, no jargon.

## Gather (in order)

1. `~/src/app-factory/STATE.md` — current phase, active apps, yesterday's plan.
2. Per active app: `apps/<name>/STATUS.md` (stage, in-flight tasks, blockers) and
   recent git log in its workspace.
3. Pending gates: grep STATE.md "Awaiting founder" section.
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

**Needs founder** — pending gates and up to 3 decision-shaped questions, each with your
recommended default so a one-word reply resolves it.

## After posting

- Reply-watch until 11:00: founder replies re-plan the day (acknowledge + restate the
  changed plan in one message). No reply by 11:00 → proceed with the posted proposal.
- Write the day's plan into `STATE.md` under "Today" with a timestamp.
- Founder messages at ANY other time also re-plan — the standup is the scheduled
  steering point, not the only one.
