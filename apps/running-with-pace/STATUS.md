# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-09-20 (EOD sync — repo state and the whole PR table were stale)
- **Last verified:** 2026-09-20 18:00

## Repo state (verified)

- `origin/main` at **`a2ab343`** — "Show optional photo pins on social and journal routes
  (#96)", merged by the founder **today at 13:03Z**, after the 11:00 cutoff. Prior records
  said `913a257`; that has been stale since #98/#99/#100 landed on 09-13.
- **The local `main` checkout is at `f32921d`, 14 behind origin** (was 13) — still cannot
  fast-forward, because the working tree is dirty.
- **Working tree dirty since 2026-09-09 21:29 — day 11, deliberately.** 13 modified + 14
  untracked (one of which is `.agents/`). Of 213 non-blank added lines, **128 do not appear
  anywhere in #88's rebased branch** (`4cd874b`): the watch-inbox drain with its 15s retry,
  the navy splash bridge, event dedupe by stored id in `app-pipeline.ts`, and the
  `coalesce(excluded.device_id, ...)` device-attribution SQL in `events.ts`. **Discarding
  would destroy single-copy work — this needs a founder decision, not a default.**
- **The founder was active today** even though the engine was idle: #96 merged, and
  `c36cada` (#97), `3c996cf` (#101) and `87f9a84` (referrals/entitlements) all advanced.

## Open PRs — 6 non-draft + 2 draft (`gh`, 2026-09-20 18:00)

| PR | State | Note |
| --- | --- | --- |
| #101 | draft/MERGEABLE, 3 green | **Opened today.** Calendar baselines + photo previews on run maps, head `3c996cf`. |
| #97 | MERGEABLE/CLEAN, 3 green | Places + saved routes; supersedes the closed #75. Head moved to `c36cada` (was `49cc8ff`). Awaiting founder review. |
| #88 | CONFLICTING | Apple Watch integration. Finished rebase parked at `4cd874b` in `.worktrees/pr88-rebase`, unpushed — **day 11**. |
| #86 | draft **and** CONFLICTING | ASO visuals, splash handoff, NativeTabs. Prior records listed it only as a draft. |
| #83 | CONFLICTING | Profile avatars. Rebase done 09-14: `pr83-rebase` @ `71ee06d`, clean and green, unpushed. |
| #81 | CONFLICTING, **not a draft** | Referral code system. Recorded as a draft since 09-14; it never was one. |
| #80 | CONFLICTING | Goal badges + journal gallery. **Needs the author**: 13 conflict hunks across the 4 integration files. Rebase `83feb88` **is** on `origin/cursor/goal-badge-gallery-7c74` — not at risk. |
| #78 | CONFLICTING | ASO visual system. **Recommend close**: 66 conflict hunks across 12 files. Salvage rebased, clean and green at `pr78-salvage` @ `37efb30`, unpushed. |

**#96 is merged** (13:03Z today) and is no longer an open PR.

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
