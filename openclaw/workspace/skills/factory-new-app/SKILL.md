---
name: factory-new-app
description: Start the product process for a new app idea — creates the app workspace and kicks off stage 1 (refinement) with the product-lead profile. Use when the founder shares an app idea.
user-invocable: true
---

# New App Intake

Input: the founder's idea, however rough ("what about a tip-splitting app?").

## Steps

1. **Clarify before creating.** If the idea is ambiguous about audience or intent, ask
   1–3 decision-shaped questions first (with defaults). Do not create workspaces for
   ideas you don't understand — a wrong assumption here invalidates everything after.
2. Pick a working codename (lowercase-hyphenated; NOT the final brand name — that's
   stage 3's job).
3. Create the app workspace from the spec scaffold:
   `~/src/app-factory/apps/<codename>/` containing `spec.md` (from
   `~/src/app-factory/template/spec-scaffold/spec.md`), `STATUS.md`, `decisions.md`,
   `brand-pack/` (empty scaffold).
4. Record the spark verbatim in `spec.md` § Spark, with date and source.
5. Spawn a **product-lead** session (profile: `~/src/app-factory/agents/product-lead.md`,
   workspace: the new app folder) with the instruction: run stages 1–2 (refinement +
   market check, including "reasons not to build this"), draft into spec.md, and return
   open questions for the founder.
6. Update `STATE.md`: add the app at stage 1; queue the product-lead's questions for
   the next standup (or relay immediately if the founder is in-conversation).

## Constraints

- Stage order is not skippable. No brand work before stage 2 survives review; no code
  before the founder's spec gate.
- If the product-lead's stage-2 verdict is "don't build," present that verdict with
  its reasons at standup — killing ideas early is a success, not a failure.
