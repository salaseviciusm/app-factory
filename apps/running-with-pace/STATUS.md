# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-09-26 (EOD sync — #102 new, #97 head moved, dirty tree now day 17)
- **Last verified:** 2026-09-26 18:00
- **Prior verification:** 2026-09-20 18:00

## Repo state (verified)

- `origin/main` still at **`a2ab343`** — "Show optional photo pins on social and journal
  routes (#96)", merged 2026-09-20 13:03Z. **No founder merges in the six days since**
  (re-fetched 2026-09-26). The 09-20 record noted him active that day; that activity did
  not continue into merges.
- **The local `main` checkout is still at `f32921d`, 14 behind origin** — still cannot
  fast-forward, because the working tree is still dirty.
- **Working tree dirty since 2026-09-09 21:29 — day 17, deliberately.** 13 modified + 14
  untracked (one of which is `.agents/`). Of 213 non-blank added lines, **128 do not appear
  anywhere in #88's rebased branch** (`4cd874b`): the watch-inbox drain with its 15s retry,
  the navy splash bridge, event dedupe by stored id in `app-pipeline.ts`, and the
  `coalesce(excluded.device_id, ...)` device-attribution SQL in `events.ts`. **Discarding
  would destroy single-copy work — this needs a founder decision, not a default.** Carried
  unresolved for over two weeks now; one stray `git checkout .` ends it.

## Open PRs — 7 non-draft + 2 draft = 9 open (`gh`, 2026-09-26 18:00)

| PR | State | Note |
| --- | --- | --- |
| #102 | MERGEABLE, not a draft | **NEW since the last sync.** "Make voice coaching concise and regenerate English audio", head `eba38bd`. |
| #101 | draft/MERGEABLE | Calendar baselines + photo previews on run maps, head `3c996cf` (unchanged). |
| #97 | MERGEABLE/CLEAN | Places + saved routes; supersedes the closed #75. **Head moved to `075ee8d`** (was `c36cada`). Still awaiting founder review. |
| #88 | CONFLICTING | Apple Watch integration. Finished rebase parked at `4cd874b` in `.worktrees/pr88-rebase`, unpushed — **day 11**. |
| #86 | draft **and** CONFLICTING | ASO visuals, splash handoff, NativeTabs. Prior records listed it only as a draft. |
| #83 | CONFLICTING | Profile avatars. Rebase done 09-14: `pr83-rebase` @ `71ee06d`, clean and green, unpushed. |
| #81 | CONFLICTING, **not a draft** | Referral code system. Recorded as a draft since 09-14; it never was one. |
| #80 | CONFLICTING | Goal badges + journal gallery. **Needs the author**: 13 conflict hunks across the 4 integration files. Rebase `83feb88` **is** on `origin/cursor/goal-badge-gallery-7c74` — not at risk. |
| #78 | CONFLICTING | ASO visual system. **Recommend close**: 66 conflict hunks across 12 files. Salvage rebased, clean and green at `pr78-salvage` @ `37efb30`, unpushed. |

**#96 is merged** (2026-09-20 13:03Z) and is no longer an open PR.

Rebase worktrees re-verified intact and all still **unpushed**: `pr78-salvage` `37efb30`,
`pr80-rebase` `83feb88`, `pr83-rebase` `71ee06d`, `pr88-rebase` `4cd874b`.

Full working: `apps/running-with-pace/notes/2026-09-14-rebase-prep.md`.

## Standing boundary

No push, force-push, PR comment or merge against the founder's remote unattended.
This is why #88's finished rebase and today's three rebase branches all sit local.

## Residue

- **PlaceSheet** — `getPoiRoutesHandler` and the `usePoiRoutes`/`usePoiRoute` hooks
  survive in #97 with no UI calling them, so discovered guided routes are
  unreachable. Small brief on top of #97; **nothing filed, and nothing will be until
  #97 merges.**

## Single-copy exposure (verified 2026-09-20)

Unpushed and existing in exactly one place: the dirty `main` tree (27 entries),
`pr83-rebase` `71ee06d`, `pr78-salvage` `37efb30`, `codex/create-apple-watch-integration-branch`
`4cd874b`, and `codex/referrals-entitlements-review` `87f9a84` (new today). With Time
Machine still unconfigured, none of these has a second copy anywhere.

**Not** exposed, contrary to prior records: `~/.codex/worktrees/0378/running-with-pace`
(2.0GB) is #97's head `c36cada`, clean and fully on `origin`. 1.6GB of it is
`pace-react-native` build output plus 166MB of `node_modules`. Disk bloat; safe to delete.
