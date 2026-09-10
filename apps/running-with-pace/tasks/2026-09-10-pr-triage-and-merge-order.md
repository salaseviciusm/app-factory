# 2026-09-10 — Merge-order call (#88, #87) and stale-PR triage (#37, #44, #75)

**Profile:** tech-lead · **Rig:** running-with-pace (`~/src/running-with-pace`)
**Reviewer:** chief-of-staff (routes to founder) · **Origin:** 2026-09-10 standup items 2 and 3

## Objective
Produce two written recommendations — nothing merged, nothing closed.

## Part A — merge order for #88 and #87
Both are large and both touch the event model.
Note at dispatch: **#88 is now CONFLICTING** (the standup recorded it as passing/awaiting
review at 08:00) while #87 is still `MERGEABLE`. Verify before recommending.
DoD: one line per PR — which goes first, and the specific conflict risk for the second
(name the files/model areas that collide).

## Part B — stale-PR triage
#37 (179d), #44 (32d), #75 (14d) — all CONFLICTING.
DoD: per PR, `close` or `rebase`, with the reason in one line (what on main has superseded
it, or what still makes it worth the rebase cost). Founder's stated default is close #37
and #44, rebase #75 — confirm or contradict it with evidence.

## Boundaries
- Read-only on GitHub: no merging, no closing, no pushing. Recommendations only.
