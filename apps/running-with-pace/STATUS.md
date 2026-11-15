# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-11-15 (EOD sync — 7 quiet days, queue static at 23, a merge-order plan now exists for it)
- **Last verified:** 2026-11-15 18:00
- **Prior verification:** 2026-11-14 18:00
- **Prior verification:** 2026-11-08 18:00
- **Prior verification:** 2026-10-23 18:00
- **Prior verification:** 2026-10-22 18:00
- **Prior verification:** 2026-09-26 18:00

## Repo state (verified 2026-11-15 18:00)

- **Still quiet, now 7 days.** `origin/main` is **still `7328ce8c`** (2026-11-08 17:50) —
  zero merges in a week, the longest gap since 2026-09-27. Local `main` is still **behind 14**
  with nothing of its own; untracked `.agents/skills/` dirs still **five**.
- **The queue is static, not just unchanged in count: 23 open** (20 non-draft / 3 draft,
  **17 MERGEABLE / 6 CONFLICTING**), and **not one of the 23 has any activity dated today**.
  `#88` is still `OPEN` and `MERGEABLE`, so `stash@{0}` (5 stash entries) is still not
  droppable on the recorded basis.
- **A merge-order plan now exists for this queue**, posted to #factory-pace today
  (`1794740611.236079`) and recorded in STATE.md. Built read-only from full paginated file
  lists for all 23 PRs, a pairwise collision matrix, and `git merge-tree` against
  `origin/main`. Two findings shrink the queue to an **effective 20**: **#86 is a strict
  superset of #78** (merge #86, close #78), and **#152 supersedes #88 and #150** by their own
  bodies while being the only MERGEABLE + green one of the three. Measured conflict spread
  (not GitHub's flag): #112 **41** files, #86 20, #78 15, #126 10, #81 8, #150 4. Collision
  hotspots touched by 9-10 PRs each: `run-rebuilds.ts`, `events.ts`, `routes/api.ts`,
  `src/impl/api.ts`, `run-lifecycle.test.tsx`, `app-pipeline.ts`, `hooks/api.ts`.
  #130 needs its **base retargeted to `main`** before merging. **Nothing in the plan has been
  executed** — the merge seat and the three closures are the founder's call.
- **The three single-copy branches are still on origin**, re-verified by `git ls-remote`:
  `pr78-salvage` `37efb30b`, `pr83-rebase` `71ee06d5`,
  `codex/referrals-entitlements-review` `87f9a844`. `tmutil` still reports **no Time Machine
  destinations**, so origin remains the only second copy — but a real one.
- No engine run has touched this rig since 2026-10-23 (**23 days**); the engine has started
  nothing on any rig in that time, and spent **$0 over the last 7 days**.

## Repo state (prior verification, 2026-11-14 18:00)

- **The repo has gone quiet.** `origin/main` is **still `7328ce8c`** (2026-11-08 17:50) —
  **zero merges in six days**, the first such gap since 2026-09-27 and a reversal of the
  trend every prior record described. The 11-08 headline ("Pace is not quiet") no longer
  holds. Local `main` is still **behind 14**; nothing local to lose. Untracked
  `.agents/skills/` dirs are back to **five** (the 11-08 record noted two).
- **The open queue grew while merging stopped: 21 → 23** (17 `MERGEABLE`, 6 `CONFLICTING`).
  **`#88` is still `OPEN` and `MERGEABLE`**, so `stash@{0}` is still not droppable on the
  recorded basis.
- **The three single-copy branches are now on origin — a 21-day data-loss exposure is
  closed.** Pushed by the 11-14 cutoff turn, re-verified here by `git ls-remote origin`:
  `pr78-salvage` `37efb30b`, `pr83-rebase` `71ee06d5`,
  `codex/referrals-entitlements-review` `87f9a844`. Push-only — nothing merged, rewritten
  or force-pushed. Time Machine still has **no destinations configured**, so origin is the
  only second copy, but it is a real one.
- No engine run has touched this rig since 2026-10-23 (**22 days**); the engine has started
  nothing on any rig in that time.

## Repo state (prior verification, 2026-11-08 18:00)

- `origin/main` at **`7328ce8c`** — "Compact, legible routes panel: stat strip, one start
  action, content-sized (#154)". **Fourteen merges since the 10-23 record** (#143, #144,
  #145, #146, #154 and the rest), which makes **40 founder merges since 09-27 — still every
  one from his own `codex/*` branches, still zero from the engine.** The factory has not
  touched this repo in 16 days; the engine has run nothing on any rig since 2026-10-23.
- **Local `main` is `behind 14`.** Benign — nothing local to lose — but the 10-22 record's
  "level with `origin/main`" is now two records out of date. Tree clean apart from two
  untracked `.agents/skills/` dirs (down from five).
- **`#141` did not stay merged in the form recorded.** The 10-23 record listed #141 as
  MERGEABLE and opened 10-22; it landed and was then **re-landed as #143** ("Saved routes
  from real history (re-land #141)"). Worth knowing before trusting a PR number as shipped.
- **The day-18 dirty tree stays RESOLVED**, but the exit condition has *not* been met:
  **PR #88 is still open and still MERGEABLE.** The 10-23 record said `stash@{0}` would be
  "safe to drop once #88 merges" — it has not merged, so do not drop it. The supersession
  claim itself still checks out (#88's head is on origin), so the ~128 lines are not at risk;
  only the cleanup is still pending.

### Prior repo state (2026-10-23, kept for the trace)

- `origin/main` at **`bcad83ea`** — "todo-crunch: name branches after the agent doing the
  work (#142)", **2026-10-23**. **Five further merges since the 10-22 record:** #132 and #136
  on 10-22, then #135, #133 and #142 today. That makes **26 founder merges since 09-27** —
  **every one from his own `codex/*` branches, still zero from the engine.** The "five quiet
  days, nothing merged today" line in the previous record was true on 10-22 and is now wrong;
  the repo has moved on two consecutive days.
- **Local `main` is `behind 5`** — the 10-22 record's "level with `origin/main`, first time in
  weeks" no longer holds. Benign (nothing local to lose) but it is not a standing achievement.
  Tree clean apart from the same 5 untracked `.agents/skills/` dirs.
- **The day-18 dirty tree stays RESOLVED**, and the 10-22 trace of it is unchanged and still
  correct. The 13 modified files are intact in **`stash@{0}`** (13 files / +206), and the
  supersession claim checks out: the distinctive markers are absent from `origin/main`, but
  the device-attribution SQL reappears in a **strictly more developed form** on
  `codex/watch-restacked-20261018` — `coalesce(user_events.device_id, excluded.device_id)`
  guarded by a `CASE WHEN EXISTS (SELECT 1 FROM event_acceptances …)`, where the stash had
  only `coalesce(excluded.device_id, …)`. That branch's tip `b1e4d89e` **is the head of PR #88
  on origin**, so the work has a remote copy. **The ~128 lines once carried as single-copy are
  not at risk.** `stash@{0}` is a redundant older copy, safe to drop once #88 merges.
- **No single-copy work in the founder's `wt` worktrees** (checked this sync). All four Pace
  worktrees are level with their upstreams; the only dirt in each is a modified
  `package-lock.json`. `impl-todos` has no upstream but **zero** commits beyond `origin/main`.
  The **13G** under `~/src/.worktrees/running-with-pace` is disk cost, not risk, and it is the
  founder's to reclaim, not the factory's.

## Open PRs — 18 non-draft + 3 drafts = 21 open (`gh`, 2026-11-08 18:00)

**Net 19 → 21 across sixteen days: the queue grew while the factory watched.**
**15 MERGEABLE, 6 CONFLICTING, 3 of the 21 are drafts (#153, #150, #86).**

| PRs | State | Note |
| --- | --- | --- |
| #152, #151, #149, #148, #147 | MERGEABLE | New since the 10-23 record. |
| #153 | MERGEABLE, **draft** | New since 10-23. |
| #131, #130, #129, #128, #127 | MERGEABLE | Carried unchanged 16 days (the 10-11 account-journal wave plus #131). |
| #116, #115 | MERGEABLE | Design PRs, opened 10-10, carried unchanged. |
| #88 | MERGEABLE | Apple Watch recording. **60 days old, still the oldest thing in the merge queue, still unmerged.** Blocks the `stash@{0}` cleanup. |
| #83 | MERGEABLE | Profile avatars, **62 days**. Local `pr83-rebase` @ `71ee06d5` still unpushed. |
| #150 | CONFLICTING, **draft** | New since 10-23. |
| #126, #112, #81 | CONFLICTING | Account-journal isolation; places catalog; referral code system (#81 now **63 days**). |
| #78 | CONFLICTING | ASO visual system, **65 days — the oldest open PR. Recommend close** (unchanged recommendation, 16 days unactioned): 66 conflict hunks across 12 files. Salvage at `pr78-salvage` @ `37efb30b`, unpushed. |
| #86 | draft **and** CONFLICTING | ASO visuals, splash handoff, NativeTabs. **61 days.** |

**#139 and #142 are gone from the queue** — #139 was CONFLICTING on 10-23 and has since
merged (`67b9a72e`), so that conflict resolved itself without intervention.

**15 PRs are MERGEABLE and need nothing but founder review.** The review seat, not the
engine, remains the bottleneck: 40 founder merges and zero engine PRs since 09-27.

Full working: `apps/running-with-pace/notes/2026-09-14-rebase-prep.md`.

## Standing boundary

No push, force-push, PR comment or merge against the founder's remote unattended.
This is why #88's finished rebase and today's three rebase branches all sit local.

## Residue

- **PlaceSheet** — `getPoiRoutesHandler` and the `usePoiRoutes`/`usePoiRoute` hooks
  survive in #97 with no UI calling them, so discovered guided routes are
  unreachable. Small brief on top of #97; **nothing filed, and nothing will be until
  #97 merges.**

## Single-copy exposure (re-verified 2026-11-08 by reachability from origin, not by name)

Down from five items to three. Each tip was tested with
`git ls-remote --heads origin <name>` **and** `git branch -r --contains <tip>` — a branch
absent from origin under its own name can still be reachable from another remote ref, and
one entry on the old list turned out to be exactly that case.

Still unpushed and reachable from no remote ref:

- `pr78-salvage` **`37efb30b`** — the #78 salvage rebase.
- `pr83-rebase` **`71ee06d5`** — the #83 avatars rebase.
- `codex/referrals-entitlements-review` **`87f9a844`**.

No longer exposed:

- **The sep-9 dirty tree** — in `stash@{0}`, superseded by PR #88's head `b1e4d89e` on
  origin (see "Repo state").
- **`pr80-rebase` `83feb888`** — *was on the at-risk list and never belonged there.* Not on
  origin under that name, but `git branch -r --contains 83feb888` resolves it to the remote
  ref **`pr/80`**. It has a remote copy.

**All three re-tested 2026-11-08** with `git branch -r --contains <tip>`: each still returns
nothing, and each local branch still exists at the same tip. **Unchanged for 16 days.** With
Time Machine still unconfigured, the three above have no second copy anywhere — this is the
oldest unactioned data-loss risk on the app and it has now survived two records untouched.

**Not** exposed, contrary to prior records: `~/.codex/worktrees/0378/running-with-pace`
(2.0GB) is #97's head `c36cada`, clean and fully on `origin`. 1.6GB of it is
`pace-react-native` build output plus 166MB of `node_modules`. Disk bloat; safe to delete.
