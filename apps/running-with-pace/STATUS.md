# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-10-23 (EOD sync — 5 further founder merges, queue recomposed to 19 open, local `main` behind again)
- **Last verified:** 2026-10-23 18:00
- **Prior verification:** 2026-10-22 18:00
- **Prior verification:** 2026-09-26 18:00

## Repo state (verified)

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

## Open PRs — 18 non-draft + 1 draft = 19 open (`gh`, 2026-10-23 18:00)

Net 21 → 19 across today: #132, #133, #135, #136 and #142 merged out; #140 and #141 came in.
**13 MERGEABLE** (12 with all three checks green, plus #83 with no checks) and
**6 CONFLICTING**. The cutoff's count this morning — "19 open, 12 green and mergeable, 6
conflicting" — still holds by count tonight, but the membership churned underneath it.

| PRs | State | Note |
| --- | --- | --- |
| #141, #140, #137, #134 | MERGEABLE, three checks green | Opened 10-22. #140 is docs-only (offline-first contract). |
| #131 | MERGEABLE, three checks green | Opened 10-20. |
| #130, #129, #128, #127 | MERGEABLE, three checks green | The 10-11 account-journal wave. |
| #116, #115 | MERGEABLE, three checks green | Design PRs, opened 10-10. |
| #88 | **MERGEABLE, checks green** | Apple Watch recording. Head `b1e4d89e`, the restacked branch superseding the sep-9 dirty tree. **44 days old, the oldest thing in the merge queue.** |
| #83 | MERGEABLE, **no checks configured** | Profile avatars, 47 days. Local `pr83-rebase` @ `71ee06d` still unpushed. |
| #139 | CONFLICTING, checks green | todo-crunch review-wait; **newly conflicted** by its own sibling #142 merging today. |
| #126 | CONFLICTING, checks green | Account-journal isolation; conflicted by the 10-22/10-23 merges. |
| #112, #81 | CONFLICTING, checks green | Places catalog; referral code system. #81 was never a draft, despite pre-09-14 records. |
| #78 | CONFLICTING, no checks | ASO visual system, **49 days — the oldest open PR. Recommend close**: 66 conflict hunks across 12 files. Salvage at `pr78-salvage` @ `37efb30`, unpushed. |
| #86 | draft **and** CONFLICTING | ASO visuals, splash handoff, NativeTabs. |

**12 PRs are MERGEABLE with all three checks green and need nothing but founder review.** The
review seat, not the engine, is the bottleneck on this app: 26 founder merges and zero engine
PRs since 09-27.

Full working: `apps/running-with-pace/notes/2026-09-14-rebase-prep.md`.

## Standing boundary

No push, force-push, PR comment or merge against the founder's remote unattended.
This is why #88's finished rebase and today's three rebase branches all sit local.

## Residue

- **PlaceSheet** — `getPoiRoutesHandler` and the `usePoiRoutes`/`usePoiRoute` hooks
  survive in #97 with no UI calling them, so discovered guided routes are
  unreachable. Small brief on top of #97; **nothing filed, and nothing will be until
  #97 merges.**

## Single-copy exposure (re-verified 2026-10-22 by reachability from origin, not by name)

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

With Time Machine still unconfigured, the three above have no second copy anywhere.

**Not** exposed, contrary to prior records: `~/.codex/worktrees/0378/running-with-pace`
(2.0GB) is #97's head `c36cada`, clean and fully on `origin`. 1.6GB of it is
`pace-react-native` build output plus 166MB of `node_modules`. Disk bloat; safe to delete.
