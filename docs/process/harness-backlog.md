# Harness backlog — App Factory

Ranked harness-improvement backlog, maintained by the factory-retro workflow
(most valuable open item first). Items are `## R<N> — <title>` blocks; numbers
are permanent. Statuses: open | accepted | declined | done. Append new items,
update Status/Evidence in place, never delete or renumber. `factory-self-review`
reads this as its starting ranking; declined items are closed (see the linked
decision) and must not be re-proposed.

---

## R1 — A resume at a later step never revalidates worktree dependencies

- **Status:** done — run `feature-improvement-plan-resume-must` (app-factory),
  commit `9deb8b1`, merged 2026-08-19: `run.setupOk` is written only after every
  rig setup command exits 0, and `resume` at any step re-provisions when it is
  absent.
- **Observation:** Run `bug-century-club-goal-shows` (running-with-pace) ran
  `find` → `implement` ×2 → `checks` → `review` → `tests` → PR #48 and only
  died at `deploy`, the last step, on `npx expo config` failing to resolve
  `expo-router` — because `pace-react-native/node_modules` had never been
  installed. Its setup on 2026-08-09 aborted mid-list (see R2) and the
  2026-08-10 retry re-entered at step `find`, which skips `setup` entirely. The
  run reached the final step having burned $11.70 / 7.46M cache-read tokens on
  a worktree that was never fully provisioned.
- **Proposed change:** in the engine (`orchestration/bin/factory-run`), record
  per-run setup completion (e.g. a `setup.ok` marker written only when every
  rig `setup` command exits 0) and have `resume` — at any step — re-run setup
  when the marker is absent, rather than assuming a resumed worktree is ready.
- **Rough cost to try:** small — a marker file plus one guard on the resume
  path.

## R2 — Setup aborts on the first failing command and silently leaves the rest unrun

- **Status:** done — same run and commit as R1 (`9deb8b1`, 2026-08-19):
  `setupFailureSummary` names the failing command's position and the exact
  unrun tail in the failure detail and in `setup.log`.
- **Observation:** running-with-pace's rig `setup` is three commands
  (`npm install`, `cd pace-node-js-server && npm install`,
  `cd pace-react-native && npm install`). In `bug-century-club-goal-shows` the
  second failed (better-sqlite3 12.6.2 fails its node-gyp build against node
  v26.5.1 — `setup.log`, 2026-08-09T17:46:03Z) and the third never ran. The
  failure notification named only the failing command, so the missing
  `pace-react-native` install was invisible until `deploy` failed a day later.
- **Proposed change:** report the unrun tail of the setup list in the failure
  detail and in `setup.log` ("2 of 3 setup commands did not run: …"), so a
  partial provision is visible at the point of failure. Related environment
  note: better-sqlite3 does not build on node 26 on this host — a node pin
  belongs in the app repo, not the harness, but it is what triggers this
  class of failure.
- **Rough cost to try:** small — one change to the setup runner's failure
  reporting.

## R3 — rebase-train workflow

- **Status:** accepted — decision D34 (2026-09-27); delivered by run
  `feature-improvement-plan-rebase` (app-factory) from the self-review
  `self-build-rebase-train-workflow`.
- **Observation:** six of nine open running-with-pace PRs were CONFLICTING
  (oldest 183 days) while the engine sat idle for 23 days; the founder rebased
  them by hand in `.worktrees/pr<N>-rebase` checkouts and stalled on a push
  nobody was authorised to make.
- **Change:** `factory-run start --rig <rig> --workflow rebase-train --pr <n>`
  — detached checkout of the fetched PR head, rebase onto `origin/<base>`,
  bounded conflict-resolver agent (escalates rather than guesses), rig checks
  and tests on the rebased tree, force-push of the PR branch with a lease
  pinned to the fetched head sha. Never merges, never pushes the base branch,
  never pushes on a red gate. Web console and skills carry the verb.
- **Deferred (v2, D34 trigger):** `onFail` loop for rebase-induced check
  failures, `--all-conflicting` sweep, non-default base branches, fork PRs.
