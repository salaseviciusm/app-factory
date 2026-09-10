# 2026-09-10 — Green the three pace security PRs (#89, #91, #92)

**Profile:** app-engineer · **Rig:** running-with-pace (`~/src/running-with-pace`)
**Reviewer:** tech-lead · **Origin:** 2026-09-10 standup item 1 (no founder reply by 11:00 cutoff → proposal proceeds)

## Objective
Diagnose the one shared cause behind the failing `react-native` and `server` CI jobs on
PRs #89, #91 and #92, fix it once, and land the fix on all three so each is checks-green
and mergeable.

## Evidence at dispatch (11:00, 2026-09-10)
- All three: `MERGEABLE`, jobs `server` + `react-native` FAILURE, `test` passing.
- Identical failure shape across all three → treat as one shared cause until disproved.

## Definition of done
- Root cause named in one line, with the failing job log line as evidence.
- Fix applied to all three branches; `server` and `react-native` jobs green on each PR.
- `npm run type-check`, `npm run lint`, `cd pace-node-js-server && npm run build`, `npm run test:unit` pass locally.
- No scope added: security behaviour of each PR unchanged, no refactors, no new deps.
- If the cause is NOT shared, stop after the first PR and report the divergence rather than fixing three ways.

## Boundaries
- Do not merge. Do not touch credentials, store config or pricing.
- Do not rebase onto unrelated work or pull in other open PRs.
