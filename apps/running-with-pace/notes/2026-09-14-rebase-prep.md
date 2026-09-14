# Local rebase prep — Pace #83, #80, #78

**Date:** 2026-09-14
**Author:** app-engineer (App Factory)
**Task:** `apps/running-with-pace/tasks/2026-09-14-rebase-prep-83-80-78.md`
**Decider:** founder. Nothing was pushed to the Pace remote — no push, no force-push,
no PR comment, merge, close, or remote branch deletion. Pace `main`'s dirty working
tree (27 paths) was not touched. All work is in fresh worktrees under `.worktrees/`.
**Rebase target:** `origin/main = 913a257` ("Improve interval coaching, voice prompts,
and pace charts (#100)").

## Verdicts at a glance

| PR | Title | Verdict | Local head |
|---|---|---|---|
| **#83** | Preserve profile avatars across profile saves | **ready to push** (one commit deliberately dropped — see §1) | `pr83-rebase` @ **`71ee06d`** |
| **#80** | Collectible goal badges and journal gallery | **needs the author** | `pr80-rebase` @ **`83feb88`** (unrebased) |
| **#78** | Bring the ASO visual system into Pace | **should be closed instead** | `pr78-rebase` @ **`bf97777`** (unrebased); salvage at `pr78-salvage` @ **`37efb30`** |

**The common cause for #80 and #78:** PR #90 *"Revamp mobile UI with Contour styling and
relative-effort calendar"* merged **2026-09-09T20:55**. Both #80 (last updated 09-05) and
#78 (last updated 09-06) were written against the pre-Contour UI and were overtaken by it.
Their conflicts are conflicting *intent*, not conflicting *text* — per the task brief I
stopped rather than guess. #83 is unaffected because its real change is in a hook, not the UI.

---

## Baseline — what "green" means on `913a257`

Measured first, in `.worktrees/main-baseline`, so branch results can be read honestly.

| Check | Result on clean `main` |
|---|---|
| `npm run type-check` (root) | **pass** |
| `npm run lint` (root) | **0 errors, 2 warnings** — both pre-existing, `src/utils/run-progress.ts:213` and `:259`, `explicit-function-return-type` |
| `npm run test:unit` (root) | **pass** — 72 suites, 600 tests |
| `cd pace-node-js-server && npm run build` | **pass** |
| `pace-react-native` `npm test` | **flaky** — run 1: 2 suites / 2 tests failed; runs 2 and 3: 53 suites / 257 tests pass |

**The RN flake is pre-existing on `main` and is not caused by any of these branches.**
It is always the same two suites — `tests/coach-voice-sheet.test.tsx` and
`tests/workout-setup-sheet.test.tsx` — and always the same cause:
`thrown: "Exceeded timeout of 5000 ms for a test."` on a cold Jest cache. They pass on
re-run and pass with `--runInBand`. Worth a separate ticket to raise those two timeouts;
it is not a blocker for any PR below.

*(Note: `node_modules` was symlinked into each worktree from the main checkout rather than
reinstalled — `better-sqlite3` does not build under the installed node v26.5.1.)*

---

## 1. #83 — Preserve profile avatars across profile saves → **ready to push**

- **Worktree:** `~/src/running-with-pace/.worktrees/pr83-rebase`
- **Branch / head:** `pr83-rebase` @ **`71ee06d`**, `git status` clean
- **PR head as fetched:** `bc183f9` on `cursor/preserve-profile-avatar-d0a9`

### What the branch actually contained

The branch was **not cut from `main`**. Its merge-base with `main` is `94cace1`, and its
oldest commit is `75d796c` *"Add entitlements, referral codes, and premium feature gates"*
— **59 files, +4425 lines** covering entitlements, referral codes, premium gating, and new
server routes. That commit is **not mentioned anywhere in PR #83's title or body**, which
describes only the avatar fix and lists only `hooks/api.ts` and
`tests/profile-photo-update.test.tsx` in its test plan.

A straight `git rebase origin/main` produces **28 conflict hunks across 13 files — every
single one of them inside `75d796c`**. The three avatar commits conflict with nothing.

### Resolution

I rebased **only the work the PR describes**:

```
git rebase --onto origin/main 75d796c pr83-rebase
```

**Result: zero conflicts.** Three commits replayed clean —
`1f70d51` (preserve photo across saves), `f9704c9` (fixtures), `71ee06d` (lint).

Final diff vs `main` is exactly what the PR body promises:
`pace-react-native/hooks/api.ts` (+45/-18) and `tests/profile-photo-update.test.tsx`
(+143, new). The fix swaps the `Set<uri>` of already-uploaded photos for a
`Map<localUri, imageId>`, so a later profile-field save re-sends the resolved `photo_id`
instead of clearing it, and a failed upload now throws instead of silently dropping the
avatar.

### Conflict hunks and how they were resolved

**None.** No hunk was resolved by hand on this branch. The 28 hunks were all avoided by
dropping `75d796c`, not by resolving them.

### Checks

| Check | Result |
|---|---|
| root `npm run type-check` | **pass** |
| root `npm run lint` | **0 errors, 2 warnings** (identical to baseline) |
| root `npm run test:unit` | **pass** — 72 suites, 600 tests |
| `pace-node-js-server` `npm run build` | **pass** |
| `pace-react-native` `npx tsc --noEmit` | **pass** |
| `pace-react-native` `npm test` | run 1: the 2 known-flaky suites failed; **re-run: pass — 54 suites, 259 tests** |

54 suites / 259 tests vs the baseline's 53 / 257: the new
`profile-photo-update.test.tsx` suite and its 2 tests, both passing.

### The decision the founder still has to make

`pr83-rebase` is a **one-command push away from being a clean, green, correctly-scoped PR**
— but pushing it **drops `75d796c` from the branch**, removing 59 files of entitlements /
referral / premium-gating work from PR #83.

That work is not lost (it is still reachable at `bc183f9` and on the remote branch), but
it needs a home. Two options:

1. **Recommended** — push `pr83-rebase`, let #83 merge as the small avatar fix it claims
   to be, and re-home entitlements into its own PR off current `main`. That feature
   deserves a real review; it should not ride in on an avatar bugfix.
2. Keep them together — then somebody must resolve those 28 hunks in payment-gating code,
   and #83 stops being an 8-day-old one-file fix.

I did not choose between these: option 1 changes what PR #83 is, which is the founder's
call, not mine.

---

## 2. #80 — Collectible goal badges and journal gallery → **needs the author**

- **Worktree:** `~/src/running-with-pace/.worktrees/pr80-rebase`
- **Branch / head:** `pr80-rebase` @ **`83feb88`** — **unrebased**, rebase aborted,
  `git status` clean
- **PR head as fetched:** `83feb88` on `cursor/goal-badge-gallery-7c74` (8 commits, merge-base `1647d7d`)

### Why I stopped

The rebase halts on the foundational commit `ee17edb` *"Add collectible goal badge system"*
with **13 conflict hunks across 4 files**. Those 4 files are the entire integration surface
of the badge system — and PR #90 rewrote three of them out from under it:

| File | Hunks | What #90 (`9f3b5fc`) did to it |
|---|---|---|
| `components/ui/goals/GoalCard.tsx` | 4 | **+58 / −506** — fully rewritten |
| `components/ui/journal/CompletedGoalBadges.tsx` | 4 | +14 / −16 — light touch |
| `components/ui/goals/StreakGoalCard.tsx` | 3 | **+32 / −490** — gutted |
| `app/(tabs)/goals.tsx` | 2 | **+89 / −428** — fully rewritten |

The decisive one is `GoalCard.tsx`. #80 rewrites the **old** card — `FlippableCard` faces,
`RadialProgress`, icon circles, a ~300-line local `StyleSheet.create` — to render `GoalBadge`
art instead of Ionicons. On current `main` that card no longer exists: it is now
`memo(GoalCard)` built on `GoalFlipCard`, `GoalProgressTrack`, `goalCheckpoints`,
`useContourTheme` and themed `useStyles()`. There is no `FlippableCard`, no local stylesheet,
and no `icon` prop to remove.

So resolving these hunks is not merging two edits — it is **re-implementing the badge front
and back faces against the Contour card architecture**. That is authoring, not rebasing, and
the brief is explicit that a wrong resolution is worse than an unrebased branch. I stopped.

### The good news — the expensive part of #80 survives intact

#80 touches **52 files: 47 additions and only 5 modifications.** The 47 additions are the
badge system proper — **43 raster badge art assets**, `components/ui/goals/GoalBadge.tsx`,
`goal-badge-specs.ts`, and their tests. I verified every one of those 47 paths against
`origin/main`: **none of them exists there, so none of them can conflict.**

All 13 conflict hunks live in the 5 modified files. The art, the component and the specs
are conflict-free; only the wiring is stale.

### Recommendation for the author

Split #80 in two:

1. **Foundation PR** — the 47 additive files (art + `GoalBadge` + specs + tests). Rebases
   onto `913a257` with zero conflicts. Reviewable on its own merits.
2. **Wiring PR** — re-author the badge faces on top of Contour's `GoalFlipCard`, plus the
   journal gallery. `CompletedGoalBadges.tsx` is the only one of the four that is a genuine
   small merge; the other three need fresh work against the new card.

### Checks

**Not run.** The branch is unrebased, so checks against `main` would not be meaningful.

---

## 3. #78 — Bring the ASO visual system into Pace → **should be closed instead**

- **Worktree:** `~/src/running-with-pace/.worktrees/pr78-rebase`
- **Branch / head:** `pr78-rebase` @ **`bf97777`** — **unrebased**, rebase aborted
- **Salvage branch:** `pr78-salvage` @ **`37efb30`** — rebased, clean, green (see below)
- **PR head as fetched:** `bf97777` on `cursor/aso-visual-system-2ccc` (2 commits, merge-base `5a0747a`)

### Why this one should be closed, not rebased

`git rebase origin/main` stops on `7d08ad6` *"Bring ASO visual system into the app"* with
**66 conflict hunks across 12 files**. The reason is not incidental drift — it is that
**#78 and the already-merged #90 are two different answers to the same question.** Both are
whole-app visual system overhauls. #90 won by merging on 09-09; #78 was last updated 09-06.

`styles/common-stylesheet.tsx` shows it in one hunk:

- **`main`** — `export const useCommonStyles = createThemedStyles(theme => ...)`, a themed
  hook drawing from `./contour` tokens (`theme.canvas`, `theme.surface`, `theme.action`…).
- **#78** — `export const commonStyles = StyleSheet.create({...})`, static, built on a
  hand-rolled `adaptiveColor()` / `DynamicColorIOS` helper over `BRAND_COLORS`.

These are not reconcilable line-by-line. #78 restyles ~45 call sites through a static
`commonStyles` object that `main` has replaced with a theme hook. Rebasing it would mean
rewriting the entire ASO visual system on top of Contour — which is just "design the app
again", and the founder has already shipped the answer to that.

**Recommendation: close #78 as superseded by #90**, after salvaging the one piece below.

### What is worth salvaging — and it is already done and green

The branch's second commit, `bf97777` *"Keep coach state through the first GPS fix"*, has
**nothing to do with the visual system.** It is a 10-line idempotency guard in
`pace-react-native/src/impl/coach-voice-runtime.ts`: a `runActive` flag so that a second
`notifyCoachRunStarting()` — which the first GPS fix can trigger — does not `session.reset()`
and wipe live coach state mid-run. That is a real bug fix and it would be lost if #78 were
simply closed.

I cherry-picked it onto `913a257` as **`pr78-salvage` @ `37efb30`**.

#### Conflict hunk and how it was resolved

One conflict, in `pace-react-native/tests/coach-voice-runtime.test.ts`. The runtime source
file merged cleanly.

```
<<<<<<< HEAD
||||||| parent of bf97777
        expect(cues.at(-1)).toBe('Hold this.');
=======
        expect(mockReset).toHaveBeenCalledTimes(1);
        expect(cues.at(-1)).toBe('Hold this.');
>>>>>>> bf97777
```

`main` had deleted the `cues.at(-1)` assertion; #78 had added a `mockReset` assertion
immediately above that same line. **Resolved by keeping `main`'s deletion and #78's
addition** — i.e. the region becomes just
`expect(mockReset).toHaveBeenCalledTimes(1);`. This is the assertion that carries the
commit's intent: it proves `reset()` was *not* called a second time when the first snapshot
arrives. Re-introducing the `cues` line would have reverted an unrelated deliberate change
on `main`.

#### Checks on `pr78-salvage` @ `37efb30`

| Check | Result |
|---|---|
| `npx jest tests/coach-voice-runtime.test.ts` | **pass** — 1 suite, 1 test |
| root `npm run type-check` | **pass** |
| root `npm run lint` | **0 errors, 2 warnings** (identical to baseline) |
| root `npm run test:unit` | **pass** — 72 suites, 600 tests |
| `pace-node-js-server` `npm run build` | **pass** |
| `pace-react-native` `npx tsc --noEmit` | **pass** |
| `pace-react-native` `npm test` | run 1: the 2 known-flaky suites failed; **re-run: pass — 53 suites, 257 tests** |

`pr78-salvage` is ready to push as a small standalone bugfix PR whenever the founder wants it.

---

## State left on the machine

Created, all unpushed, nothing deleted or pruned:

| Worktree | Branch | Head | Status |
|---|---|---|---|
| `.worktrees/pr83-rebase` | `pr83-rebase` | `71ee06d` | rebased, clean, green |
| `.worktrees/pr80-rebase` | `pr80-rebase` | `83feb88` | unrebased (aborted), clean |
| `.worktrees/pr78-rebase` | `pr78-salvage` | `37efb30` | rebased salvage, clean, green |
| `.worktrees/pr78-rebase` | `pr78-rebase` | `bf97777` | unrebased (aborted) |
| `.worktrees/main-baseline` | `main-baseline` | `913a257` | baseline reference |

**Upstream tracking was unset on every one of these branches**, so no accidental bare
`git push` can reach `origin`. The pre-existing `.worktrees/pr88-rebase` @ `4cd874b` and all
other worktrees were left untouched.
