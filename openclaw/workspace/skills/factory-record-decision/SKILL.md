---
name: factory-record-decision
description: Append a decision to the correct decision log (factory-wide or per-app) in the established format. Use whenever a consequential choice is made or the founder states a preference that should persist.
user-invocable: true
---

# Record a Decision

## Where

- Factory-wide (process, org, tooling, policy): `~/src/app-factory/docs/process/decision-log.md`
- App-specific: `~/src/app-factory/apps/<app>/decisions.md`
- Founder working-style observations (how he decides, not what): add to
  "Observed founder patterns" in `~/src/app-factory/docs/process/example-run.md` instead.

## Format (append; never edit past entries)

```markdown
## D<next-number> — <short title> (<YYYY-MM-DD>)

**Context:** <the situation/options, one or two lines — only if not obvious>
**Decision:** <what was decided, concretely>
**Why:** <rationale; write "(founder-stated)" when it came from the founder verbatim>
```

- Resolves an open question? Strike it through in the Open decisions table and point
  to the new D-number.
- Might a future agent "helpfully" undo this? Promote to a full ADR in the relevant
  repo's `documents/decisions/` with explicit anti-instructions
  ("Do not unify X and Y"), and link it from the log entry.

## Constraints

- Decisions record the *why*, not just the what — the why is what prevents relitigating.
- Never backdate, never renumber, never rewrite. Corrections are new entries that
  supersede old ones explicitly ("supersedes D7").
