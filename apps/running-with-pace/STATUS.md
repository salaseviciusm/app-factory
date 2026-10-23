# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-10-22 (EOD sync — 21 merges landed, the day-18 dirty tree is genuinely resolved, 21 PRs now queued)
- **Last verified:** 2026-10-22 18:00
- **Prior verification:** 2026-09-26 18:00

## Repo state (verified)

- `origin/main` at **`8f5d2df6`** — "Author geographic workout boundaries and advance live
  sections (#123)", 2026-10-17. **21 merges landed between 09-27 and 10-17** in three waves
  (10-10, 10-11, 10-17) — **every one from the founder's own `codex/*` branches, none from
  the engine.** Five quiet days since the last merge; nothing merged today.
- **The local `main` checkout is level with `origin/main`** at `8f5d2df6` — first time in
  weeks. The tree is clean apart from 5 untracked `.agents/skills/` dirs.
- **The day-18 dirty tree is RESOLVED, and the resolution is verified rather than assumed.**
  A clean tree on its own is equally consistent with the work having been *discarded*, so
  this was traced rather than inferred. The 13 modified files are intact in **`stash@{0}`**
  ("On main: sep9 watch prototype (superseded by codex/watch-restacked-20261018)",
  13 files / +206), and the supersession claim checks out: the distinctive markers are
  absent from `origin/main`, but the device-attribution SQL reappears in a **strictly more
  developed form** on `codex/watch-restacked-20261018` —
  `coalesce(user_events.device_id, excluded.device_id)` guarded by a
  `CASE WHEN EXISTS (SELECT 1 FROM event_acceptances …)`, where the stash had only
  `coalesce(excluded.device_id, …)`. That branch's tip `b1e4d89e` **is the head of PR #88
  on origin**, so the work has a remote copy. **The ~128 lines carried as single-copy and
  at-risk for 18 days are no longer at risk.** `stash@{0}` is a redundant older copy, safe
  to drop once #88 merges.

## Open PRs — 20 non-draft + 1 draft = 21 open (`gh`, 2026-10-22 18:00)

The queue more than doubled (9 → 21) across the blackout. Eight of them are under 36 hours
old. **Nothing merged today.**

| PRs | State | Note |
| --- | --- | --- |
| #131–#138 | MERGEABLE, all three checks green | Opened in the last ~36 hours; #134–#138 were still being updated today. |
| #126–#130 | MERGEABLE, all three checks green | Opened 10-18 → 10-20. |
| #115, #116 | MERGEABLE, all three checks green | Updated 10-20. |
| #88 | **MERGEABLE, checks green** | Apple Watch integration — *no longer CONFLICTING.* Head `b1e4d89e`, the restacked branch that supersedes the sep-9 dirty tree. **43 days old, the oldest thing in the merge queue.** |
| #83 | MERGEABLE, **no checks configured** | Profile avatars, 46 days. Local `pr83-rebase` @ `71ee06d` still unpushed. |
| #112, #81 | CONFLICTING, checks green | #81 is the referral code system (never a draft, despite pre-09-14 records). |
| #78 | CONFLICTING, no checks | ASO visual system, 48 days — the oldest open PR. **Recommend close**: 66 conflict hunks across 12 files. Salvage at `pr78-salvage` @ `37efb30`, unpushed. |
| #86 | draft **and** CONFLICTING | ASO visuals, splash handoff, NativeTabs. |

**16 PRs are MERGEABLE with all three checks green and need nothing but founder review.**
#96, #97, #101 and #102 have all merged since the last sync and are no longer open.

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
