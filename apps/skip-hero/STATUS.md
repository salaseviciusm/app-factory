# Status — skip-hero

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** PRIORITY APP (founder steer 2026-08-06, D27). Takes all product capacity.
  Registered rig in `orchestration/rigs.json` with a production deploy path.
  **Pre-launch: no ship date, no marketing executed, nothing posted or paid for.**
- **Last updated:** 2026-09-20 (EOD sync — the pose-parity ref went missing a second time)
- **Last verified:** 2026-09-20 18:00

## Repo state (verified)

- `~/src/skip-hero` `main` at **`5685bc0`** (2026-09-10), clean and in sync with origin.
  **Tenth quiet day** — no commits, no open PRs (`gh pr list` empty).
- Untracked and unignored: `.agents/`, `.codex/`. **Day 13** for `.agents/`.
- `factory/feature-android-pose-parity-spike` at **`893ab34`** — the 29-day single-copy
  pose-parity spike (MediaPipe live Android module, hip-oscillation v2 adaptive, session
  jump-height window, decision docs 0028/0029/0030; 38 files, +2071/-169). Local only, not
  pushed, no PR.
  **This ref went missing for the SECOND time and was restored again at the 2026-09-20
  18:00 sync** (first loss 09-14). Both times the commit survived as a dangling object;
  both times nothing pointed at it.
  **Do not be reassured by `origin/factory/feature-android-pose-parity-spike`.** That
  remote ref exists but is `bede20f` (2026-08-11), an unrelated older branch of the same
  name, 2071 deletions away from the spike. It is not a backup.
  The real backup is `apps/skip-hero/notes/2026-09-14-pose-parity-spike.diff` (+ the
  `-stat.txt` sidecar), committed in `84b1ded` and pushed to `origin/main` in app-factory.
  That habit has now saved this spike twice.

## In flight

- **Marketing-calendar gate — OPEN, awaiting founder.** Week-one calendar
  (D-3 → D+7) drafted today by the product-lead sub-agent and committed at
  `59fd17f`: `docs/marketing/apps/skip-hero-week-one-calendar.md`. Built against a
  **provisional** launch day of 2026-09-28 chosen by the factory, with every entry
  expressed D-n/D+n so a real date slides the calendar intact. §7 lists the assets
  that do not exist yet and what they cost by D-3.

## Blocked on the founder

- **Ship date — day 29 unanswered.** Everything in the calendar hangs off it.
- **Marketing-calendar gate** — yes/no on the draft above.
- **D-3 is Friday 2026-09-25 — five days out, and it has NOT passed** (the 2026-09-20
  11:00 cutoff block said it had; that was wrong). D-3 is the only founder-only hard gate
  in the week: register @skiphero on IG + YouTube (~20 min, cannot be delegated) and get
  the store listing to Ready for Sale ≥24h before D0. Per the calendar's own failure
  column: miss it and "D0 does not happen" — the whole week slides.

## Carry-over

- ~~`feature-msdpir37` failed at implement 2/11 since 2026-08-03~~ — **resolved, and
  carried wrongly for 48 days.** The retry run `feature-retry-failed-run-feature` completed
  11/11 for $8.56, and its commit `733212a` is an ancestor of `main`, carrying `d166920`
  *"Show loaded OTA update in a Settings footer badge."* The feature shipped. What remains
  is a stale `failed` row in the engine; the $31.70 is sunk but the outcome is not lost.
  **Dropped from the carry list.** Kill the engine record.
