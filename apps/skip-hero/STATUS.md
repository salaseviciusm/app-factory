# Status — skip-hero

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** **SHELVED** (2026-11-17, D36 — by the standup's posted default after **nine**
  consecutive standups with the priority question unanswered). The 2026-08-06 PRIORITY APP steer
  (D27) is superseded. Shelved means **not carried**, not abandoned: the rig stays registered in
  `orchestration/rigs.json` with its production deploy path, branches and the spike ref are kept,
  and **one word from the founder un-shelves it**. The chief of staff stops carrying the priority
  question and stops counting quiet days as an open factory concern.
  **Pre-launch: no ship date, no marketing executed, nothing posted or paid for.**
- **Last updated:** 2026-11-17 11:00 (standup cutoff — **shelved** per D36; 38 quiet days,
  63 days since any engine run, 9th standup unanswered. Re-verified today: `origin/main`
  `c2bb590` (2026-10-10) unmoved, **zero open PRs**. This is the last entry that will track the
  quiet-day count unless the founder un-shelves it.)
- **Last verified:** 2026-11-15 18:00. Re-verified unchanged: `origin/main` `c2bb590`
  (2026-10-10), **36 quiet days**; **zero open PRs** (`gh pr list` empty); local `codex/ui`
  `b969447`, **1 behind**; spike ref `origin/spike/android-pose-parity` **`893ab34b`** holds;
  untracked `.agents/`, `.codex/`. **No engine run since 2026-09-13 — 63 days.** The steering
  loop ran 3/3 slots for the second consecutive day, so the priority question was askable and
  was carried in both the 08:00 standup and the 11:00 cutoff. **#factory-standup contains no
  human message in the last 7 days**, so this is unanswered at the source, not merely
  unactioned — the **8th consecutive standup**. The designation should die by the founder's
  word, not a cutoff timer, so it still stands on paper.
- **Prior verification:** 2026-11-14 18:00. Everything below re-verified unchanged:
  `origin/main` `c2bb590` (2026-10-10), **35 quiet days**; zero open PRs; local `codex/ui`
  `b969447`, 1 behind; spike ref `origin/spike/android-pose-parity` **`893ab34`** holds;
  untracked `.agents/`, `.codex/`. **No engine run since 2026-09-13 — 62 days.**
  The standup loop ran all three slots today for the first time since 10-23, so this app's
  priority question is askable again. It was not asked at the 11:00 cutoff, by design: the
  designation should die by the founder's word, not a cutoff timer. It is now the oldest
  live question in the factory.
- **Prior verification:** 2026-11-08 18:00
- **Prior verification:** 2026-10-23 18:00
- **Prior verification:** 2026-10-22 18:00
- **Prior verification:** 2026-09-26 18:00

## Repo state (verified 2026-11-15 18:00)

> *Correction (2026-11-15 EOD): this section previously read "Twenty-nine quiet days" and
> "56 days" — figures re-verified on 2026-11-08 but never re-dated, so it contradicted the
> header above it. It now carries its own verification date and is recomputed each sync.*

- `origin/main` at **`c2bb590`** — "Merge pull request #11 from salaseviciusm/codex/ui",
  2026-10-10. **Thirty-six quiet days** since; **zero open PRs** (`gh pr list` empty,
  re-verified 2026-11-15 18:00). No engine run has touched this rig since **2026-09-13 — 63
  days.** The 09-10 → 10-10 gap was closed by the founder's own `codex/ui` work, not by the
  factory.
- The local clone sits on branch **`codex/ui`** at `b969447`, **1 behind** `origin/main`
  (`b969447` is the parent of merge commit `c2bb590`). *Correction: this morning's standup
  said 4 behind — `git rev-list --count HEAD..origin/main` is 1.*
- Untracked and unignored: `.agents/`, `.codex/`.
- **The spike's remote ref holds.** `git rev-parse origin/spike/android-pose-parity` returns
  **`893ab34b`**, re-verified 2026-11-08 — the push made on 10-23 is still there, so this
  spike's durability is still a git ref and not a habit. Nothing below needs revising.
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
  The committed backup is `apps/skip-hero/notes/2026-09-14-pose-parity-spike.diff` (90KB, +
  the `-stat.txt` sidecar) in `84b1ded`, **confirmed present on app-factory's `origin/main`**
  (`git cat-file -e`, 2026-10-23). That habit has now saved this spike twice.
  **Corrected 2026-10-23: "safe" was overstated, and D34 is not the whole story.** Until
  tonight there was **no remote git ref** for `893ab34` —
  `git rev-parse origin/spike/android-pose-parity` returned `fatal: Needed a single
  revision`. The spike was restorable only by hand-applying that 90KB patch, on a branch the
  engine had already destroyed three times, with the guard as the only thing standing between
  it and a fourth. **Now pushed: `origin/spike/android-pose-parity` = `893ab34`**, verified by
  fetch (skip-hero has no GitHub Actions, so nothing fired). D34's engine half stays closed;
  the *durability* of this particular spike is now a git ref rather than a habit.

## In flight

- **Marketing-calendar gate — OPEN, awaiting founder.** *(This is a founder gate tracked in
  prose, not an engine gate: `factory-run status --json` reports zero gates open and zero
  non-terminal runs on this rig, re-verified 2026-11-08 18:00 — the engine's only two
  non-terminal runs both belong to the app-factory rig. Nothing in the engine is holding
  it; it moves only when the founder answers.)* Week-one calendar
  (D-3 → D+7) drafted today by the product-lead sub-agent and committed at
  `59fd17f`: `docs/marketing/apps/skip-hero-week-one-calendar.md`. Built against a
  **provisional** launch day of 2026-09-28 chosen by the factory, with every entry
  expressed D-n/D+n so a real date slides the calendar intact. §7 lists the assets
  that do not exist yet and what they cost by D-3.

## Blocked on the founder

> **Correction (2026-11-08): these are no longer "unanswered" — they are UNASKED.** Prior
> records counted days of founder silence. That framing is now wrong: **no standup has been
> posted since 2026-10-23** (`factory-daily-standup` at 15 consecutive failures — OAuth
> session expiry recurring from the 25-day blackout, plus a 600s no-output mode since 11-07).
> For 16 of the days counted below, the factory had no working channel to ask on. **The
> founder has not declined to decide; he has not been asked.** Fixing the loop is the
> precondition for every item here.

- **Ship date — day 78 since first asked.** Everything in the calendar hangs off it.
- **Marketing-calendar gate — day 55** (open since `59fd17f`, 2026-09-14) —
  yes/no on the draft above.
- **The provisional launch day 2026-09-28 PASSED 41 DAYS AGO and was never replaced.**
  D-3 (2026-09-25) lapsed with none of its content done: @skiphero was never registered on
  IG or YouTube (~20 min, founder-only) and the store listing never reached Ready for Sale.
  Per the calendar's own failure column, that meant "D0 does not happen" — and it didn't.
  **There is now no launch date at all.** The calendar remains slidable intact onto any
  date the founder names; nothing in it has been executed, posted or paid for, so nothing
  has been wasted.
- **The priority question is live, and has now gone a fortnight without a forum.** D27
  (2026-08-06) made skip-hero the priority app taking all product capacity. It has had
  **29 quiet days**, zero open PRs and zero engine runs since 2026-09-13, while
  running-with-pace took **40 founder merges** since 09-27 in the same window.
  The 2026-10-23 standup proposed, as its stated default, **formally shelving skip-hero and
  making Pace the priority app** — reversing the priority half of D27. The founder did not
  reply; the 11:00 cutoff that would have enacted the default crashed; and **every standup
  and cutoff since has failed outright.** So D27 **stands unamended by accident, not by
  decision** — the stated default was never enacted and the question was never re-put. This
  is still the single biggest open question on this app, and the evidence for shelving has
  only grown since.

## Carry-over

- ~~`feature-msdpir37` failed at implement 2/11 since 2026-08-03~~ — **resolved, and
  carried wrongly for 48 days.** The retry run `feature-retry-failed-run-feature` completed
  11/11 for $8.56, and its commit `733212a` is an ancestor of `main`, carrying `d166920`
  *"Show loaded OTA update in a Settings footer badge."* The feature shipped. What remains
  is a stale `failed` row in the engine; the $31.70 is sunk but the outcome is not lost.
  **Dropped from the carry list.** Kill the engine record.
