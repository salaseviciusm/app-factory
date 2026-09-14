# Status — running-with-pace (Pace)

> Kept truthful by the chief of staff; verified against git, `gh` and the run engine.

- **Stage:** ACTIVE. The founder's own product, driven largely by him directly; the
  factory contributes feature/bug runs off `factory/*` branches that land as GitHub
  PRs. Registered rig, merge policy `review`.
- **Last updated:** 2026-09-14 (EOD sync — file created; absent for three days before this)
- **Last verified:** 2026-09-14 18:00

## Repo state (verified)

- `origin/main` at **`913a257`**.
- **The local `main` checkout is at `f32921d`, 13 behind origin** — it cannot
  fast-forward because the working tree is dirty. Prior records said "Pace main now
  `913a257`"; that is origin, not the checkout.
- **Working tree dirty since 2026-09-09 21:29 — day 6, deliberately.** 13 modified +
  14 untracked (one of which is `.agents/`). Of 213 non-blank added lines, **128 do
  not appear anywhere in #88's rebased branch** (`4cd874b`): the watch-inbox drain
  with its 15s retry, the navy splash bridge, event dedupe by stored id in
  `app-pipeline.ts`, and the `coalesce(excluded.device_id, ...)` device-attribution
  SQL in `events.ts`. All 13 untracked paths *are* in #88; the tracked modifications
  are not. **Discarding would destroy single-copy work — this needs a founder
  decision, not a default.**

## Open PRs — 6 non-draft + 2 draft (`gh`, 18:00)

| PR | State | Note |
| --- | --- | --- |
| #97 | MERGEABLE/CLEAN | Places + saved routes; supersedes the closed #75. Rebased by the founder overnight, head `49cc8ff`, three green checks. |
| #96 | MERGEABLE/CLEAN | Photo pins on social/journal routes. |
| #88 | CONFLICTING | Apple Watch integration. Finished rebase parked at `4cd874b` in `.worktrees/pr88-rebase`, unpushed. |
| #83 | CONFLICTING | Profile avatars. **Rebase done today: `pr83-rebase` @ `71ee06d`, clean and green — one push from a correctly-scoped PR.** |
| #80 | CONFLICTING | Goal badges + journal gallery. **Needs the author**: 13 conflict hunks across the 4 integration files; the art, component and specs are conflict-free. |
| #78 | CONFLICTING | ASO visual system. **Recommend close**: 66 conflict hunks across 12 files. Salvage already rebased, clean and green at `pr78-salvage` @ `37efb30`. |
| #86 | draft/CONFLICTING | ASO visuals, splash handoff, NativeTabs. |
| #81 | draft/CONFLICTING | Referral code system. |

Full working: `apps/running-with-pace/notes/2026-09-14-rebase-prep.md`.

## Standing boundary

No push, force-push, PR comment or merge against the founder's remote unattended.
This is why #88's finished rebase and today's three rebase branches all sit local.

## Residue

- **PlaceSheet** — `getPoiRoutesHandler` and the `usePoiRoutes`/`usePoiRoute` hooks
  survive in #97 with no UI calling them, so discovered guided routes are
  unreachable. Small brief on top of #97; **nothing filed, and nothing will be until
  #97 merges.**
