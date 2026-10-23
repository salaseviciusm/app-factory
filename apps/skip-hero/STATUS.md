# Status — skip-hero

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** PRIORITY APP on paper (founder steer 2026-08-06, D27) — **but the designation
  is contested and unenforced**; see "Blocked on the founder". Registered rig in
  `orchestration/rigs.json` with a production deploy path.
  **Pre-launch: no ship date, no marketing executed, nothing posted or paid for.**
- **Last updated:** 2026-10-22 (EOD sync — D34's durable fix held through a 25-day blackout; launch date 24 days lapsed)
- **Last verified:** 2026-10-22 18:00
- **Prior verification:** 2026-09-26 18:00

## Repo state (verified)

- `origin/main` at **`c2bb590`** — "Merge pull request #11 from salaseviciusm/codex/ui",
  2026-10-10. **Twelve quiet days** since; zero open PRs (`gh pr list` empty, re-verified
  2026-10-22 18:00). The 09-10 → 10-10 gap was closed by the founder's own `codex/ui` work,
  not by the factory; no engine run has touched this rig since 2026-09-13.
- The local clone sits on branch **`codex/ui`** at `b969447`, **1 behind** `origin/main`
  (`b969447` is the parent of merge commit `c2bb590`). *Correction: this morning's standup
  said 4 behind — `git rev-list --count HEAD..origin/main` is 1.*
- Untracked and unignored: `.agents/`, `.codex/`.
- **The pose-parity spike is safe, and D34's fix is now proven.** `893ab34` (MediaPipe live
  Android module, hip-oscillation v2 adaptive, session jump-height window, decision docs
  0028/0029/0030; 38 files, +2071/-169) is reachable at **`spike/android-pose-parity`**,
  verified 2026-10-22. The `factory/feature-android-pose-parity-spike` local branch is gone
  again — **as predicted and now harmless**, because the surviving name sits outside the
  `factory/*` namespace the engine's cleanup owns. It survived the entire 25-day blackout
  with no sync watching it. Four losses (09-14, ~09-20, ~09-26, 09-27) then zero in 25 days
  is the fix working; D34 is closed, not carried.
  **The engine-side guard also landed today**: app-factory PR **#7** merged at 11:03
  (`739d25c`), so `classifyCleanup()` now refuses a forced delete unless the branch tip is
  an ancestor of the merged PR's head, with a regression test
  (`orchestration/test/cleanup-diverged-tip.test.mjs`). Both halves of D34 are done.
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

- **Ship date — day 61 unanswered.** Everything in the calendar hangs off it.
- **Marketing-calendar gate — day 38 unanswered** (open since `59fd17f`, 2026-09-14) —
  yes/no on the draft above.
- **The provisional launch day 2026-09-28 PASSED 24 DAYS AGO and was never replaced.**
  D-3 (2026-09-25) lapsed with none of its content done: @skiphero was never registered on
  IG or YouTube (~20 min, founder-only) and the store listing never reached Ready for Sale.
  Per the calendar's own failure column, that meant "D0 does not happen" — and it didn't.
  **There is now no launch date at all.** The calendar remains slidable intact onto any
  date the founder names; nothing in it has been executed, posted or paid for, so nothing
  has been wasted.
- **The priority question is live.** D27 (2026-08-06) made skip-hero the priority app
  taking all product capacity. It has had 12 quiet days, zero open PRs and zero engine runs
  since 2026-09-13, while running-with-pace took 21 founder merges in the same window.
  This morning's standup proposed, as its stated default, **formally shelving skip-hero and
  making Pace the priority app** — reversing the priority half of D27. **The founder did
  not reply, and the 11:00 cutoff that would have enacted the default crashed, so D27
  still stands unamended.** This is the single biggest open question on this app.

## Carry-over

- ~~`feature-msdpir37` failed at implement 2/11 since 2026-08-03~~ — **resolved, and
  carried wrongly for 48 days.** The retry run `feature-retry-failed-run-feature` completed
  11/11 for $8.56, and its commit `733212a` is an ancestor of `main`, carrying `d166920`
  *"Show loaded OTA update in a Settings footer badge."* The feature shipped. What remains
  is a stale `failed` row in the engine; the $31.70 is sunk but the outcome is not lost.
  **Dropped from the carry list.** Kill the engine record.
