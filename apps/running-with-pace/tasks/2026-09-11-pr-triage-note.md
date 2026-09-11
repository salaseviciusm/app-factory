# PR triage, as a committed note — running-with-pace

**Date:** 2026-09-11
**Profile:** tech-lead (`~/src/app-factory/agents/tech-lead.md`)
**Reviewer:** chief of staff
**Origin:** 2026-09-11 standup, item 3, proceeded at the 11:00 cutoff (no founder reply).
Re-run of the 2026-09-10 triage, which produced a good answer in Slack and left
nothing in the repo. That miss is the reason this brief exists.

## Objective

Produce a single committed note that gives the founder a merge order for the two
live PRs and a close-or-rebase call, with evidence, on the three stale ones.

## Named output artifact (DoD, hard requirement)

`apps/running-with-pace/notes/2026-09-11-pr-triage.md`, committed to
`app-factory` main. Nothing is "done" until that path exists in a commit.
A Slack message is not the deliverable; it is a pointer to the deliverable.

The note must contain:

1. **Merge order for #88 (Apple Watch, 2d, checks passing) and #96 (photo pins on
   social/journal routes, opened 2026-09-11, checks passing)** — which lands first,
   the named files where they collide (or an explicit "no overlap" with the evidence
   that shows it), and the conflict set each ordering leaves behind. Simulate, don't
   guess: `git merge-tree` against a synthetic `main + <first PR>` commit.
2. **Close-or-rebase call on #37 (User profiles, 180d), #44 (live-run map stall,
   33d), #75 (Places discovery, 15d)** — one recommendation each with file-level
   evidence: what on main already supersedes the branch, what the branch would
   revert if merged, and what (if anything) is worth salvaging. The 2026-09-10
   triage concluded close/close/rebase; verify against today's main rather than
   inheriting it — seven PRs merged on 2026-09-10, so the ground has moved.
3. **Current mergeability per PR** at the time of writing, from
   `orchestration/bin/factory-run prs --json` plus `gh pr view`, with the timestamp.
   The 09-10 cutoff found the 08:00 standup's PR list already stale by three hours;
   state the check time explicitly.

## Boundaries

- **Read-only on GitHub.** Nothing merged, nothing closed, nothing rebased, no PR
  comments, no pushes to any pace branch. The only write is the note in `app-factory`.
- The founder makes the close/rebase calls. This note is the evidence he decides on.
- No scope beyond the five PRs named above.

## Reporting

Post outcome-first to `#factory-pace` (`C0BPEDXGG00`) with the commit SHA and the
note path, followed by the headline call per PR. If Slack send fails from the
sub-agent session, say so and return the report text — but the commit still stands
as the deliverable.
