# Addendum to 2026-09-11 PR triage — #75 vs #97

**Date:** 2026-09-12 (11:00 cutoff, by hand — chief of staff)
**Amends:** `2026-09-11-pr-triage.md` §2, "#75 → REBASE"
**New call:** **CLOSE #75.** It is superseded by
[#97 "Add Places and saved routes with verified attempt analytics"](https://github.com/salaseviciusm/running-with-pace/pull/97).
Yesterday's "rebase #75" verdict was made before #97 existed (#97 opened 2026-09-12T01:33Z).

## Evidence

Compared PR heads directly: `#75 = cursor/8c778bb5 @ aed5744` (merge-base with main
`c6df281`, 2026-09-06), `#97 = codex/saved-routes-v1 @ e7b4433` (merge-base `5304a5c`,
2026-09-10 — i.e. current main).

1. **#97 is not a descendant of #75.** `git merge-base --is-ancestor pr75 pr97` → false.
   It is a redo, not a follow-on — which is why the histories look unrelated.
2. **File coverage is a strict superset.** #75 touches 123 files; #97 touches 170.
   **122 of #75's 123 files are also in #97.** The single #75-only file is
   `pace-react-native/app.config.js`, and the only change in it is the Expo version
   bump `1.0.8 → 1.0.9` — nothing to salvage.
3. **Content carries over.** Of #75's 5,143 distinct non-trivial added lines (excluding
   lockfiles and the GeoJSON seed), **4,894 (95.2%) appear verbatim in #97's tree.**
   76 of the 122 shared files are byte-identical between the two heads; the 46 that
   differ do so because #97 is rebased onto three extra days of main and because of
   the refactor in point 5.
4. **The whole Places stack is present in #97** — `src/impl/places/*`,
   `services/place-routes.ts`, `routes/places-debug.ts`, the `web/debugging/places/`
   debug UI, the OS Open Greenspace ingest, `PlacesLayer`/`PlaceSheet`/
   `RouteHeadsUpDisplay`/`RouteCompletionScreen`, `route-guidance.ts` and its test,
   and all four `docs/places*.md`. #97 adds a saved-routes layer on top
   (`saved-routes.ts` server/db/service, `hooks/saved-routes.ts`,
   `src/impl/saved-routes-runtime.ts`, `components/routes/*`) **with three new test
   files** — `saved-routes.test.ts`, `saved-routes-runtime.test.ts`,
   `saved-routes-ui.test.tsx` — plus a server integration test.
5. **One UX difference worth knowing before closing.** `PlaceSheet.tsx` goes 644 → 293
   lines. #75's sheet browsed *server-discovered* routes for a POI (`usePoiRoutes` /
   `usePoiRoute`, with an in-sheet picker and start-index selection); #97's sheet lists
   *your saved routes* near that place instead ("Save a route from a run in your journal
   to see it here"). **The discovery capability is not lost** — `getPoiRoutesHandler`
   and the `usePoiRoutes`/`usePoiRoute` hooks both still exist in #97 — but nothing in
   #97's UI calls those hooks, so discovered guided routes are currently unreachable
   from the app. That is the one piece to re-file, not to rescue by rebasing #75.
6. **CI**: #97 is `MERGEABLE` / `CLEAN` with `test`, `server` and `react-native` all
   SUCCESS (2026-09-12T02:03Z). #75 is `CONFLICTING` / `DIRTY` with 22 conflicted files
   and **CI has never run on it**. Rebasing #75 would mean resolving 22 conflicts to
   land 14k unverified lines that #97 already ships, verified.

## Actions

- **Close #75** with a pointer to #97. Nothing salvageable beyond the version bump.
- **File a small brief**: wire #97's `usePoiRoutes` into a UI entry point so
  server-discovered guided routes are reachable again. Small, and it belongs on top of
  #97 rather than in a rebase of #75.
- Merge order from the parent note is unchanged: **#96 first** (only clean one at the
  time), then #88 once its rebase is pushed, then #97.
