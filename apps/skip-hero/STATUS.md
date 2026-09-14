# Status — skip-hero

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** PRIORITY APP (founder steer 2026-08-06, D27). Takes all product capacity.
  Registered rig in `orchestration/rigs.json` with a production deploy path.
  **Pre-launch: no ship date, no marketing executed, nothing posted or paid for.**
- **Last updated:** 2026-09-14 (EOD sync — file created; absent for three days before this)
- **Last verified:** 2026-09-14 18:00

## Repo state (verified)

- `~/src/skip-hero` `main` at **`5685bc0`** (2026-09-10), clean and in sync with origin.
  **Fifth quiet day** — no commits, no open PRs (`gh pr list` empty).
- Untracked and unignored: `.agents/`, `.codex/`. Seventh day for `.agents/`.
- `factory/feature-android-pose-parity-spike` at **`893ab34`** — the 23-day
  single-copy pose-parity spike (MediaPipe live Android module, hip-oscillation v2
  adaptive, session jump-height window, decision docs 0028/0029/0030; 38 files,
  +2071/-169). Local only, not pushed, no PR.
  **This branch ref was missing at the 18:00 sync and was restored from the dangling
  commit** — see the 2026-09-14 EOD block in STATE.md. Backed up independently as
  `apps/skip-hero/notes/2026-09-14-pose-parity-spike.{diff,stat.txt}`, committed and
  pushed in app-factory; the stat matches the commit exactly.

## In flight

- **Marketing-calendar gate — OPEN, awaiting founder.** Week-one calendar
  (D-3 → D+7) drafted today by the product-lead sub-agent and committed at
  `59fd17f`: `docs/marketing/apps/skip-hero-week-one-calendar.md`. Built against a
  **provisional** launch day of 2026-09-28 chosen by the factory, with every entry
  expressed D-n/D+n so a real date slides the calendar intact. §7 lists the assets
  that do not exist yet and what they cost by D-3.

## Blocked on the founder

- **Ship date — day 23 unanswered.** Everything in the calendar hangs off it.
- **Marketing-calendar gate** — yes/no on the draft above.

## Carry-over

- `feature-msdpir37` failed at implement 2/11 since 2026-08-03 ($31.70 sunk, 90m step
  timeout). Still neither resolved nor killed.
