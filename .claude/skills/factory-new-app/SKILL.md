---
name: factory-new-app
description: Start the App Factory new-app workflow for a quick-fire app idea, spec refinement through founder spec gate to template stamp, producing a new app under apps/ registered as a quickfire rig. Use when asked to create a new app idea, spin up a new factory app, or run the new-app workflow.
---

# Factory new-app workflow

The new-app workflow is orchestrator-driven, not engine-executed: it delegates
to the factory's new-app flow (spec refinement → market sanity → brand pack →
founder spec gate → template stamp), then registers the result as a quickfire
rig.

## Steps

1. Read and follow the canonical flow in
   `~/src/app-factory/openclaw/workspace/skills/factory-new-app/SKILL.md`
   (spec and brand-pack structure, template stamping, founder gate).
2. The new app lives at `~/src/app-factory/apps/<name>` and is addressable as
   rig `factory:<name>`.
3. Subsequent work on the app uses the standard engine (quickfire tier:
   template checks only, no agentic review loop by default):

```bash
~/src/app-factory/orchestration/bin/factory-run start \
  --rig factory:<name> --workflow feature-dev --prompt "<first feature>"
```

## Notes

- The spec gate is a founder decision: present the spec and wait for approval
  before stamping the template.
- Quickfire apps have no EAS deploy configured until promoted; the marketing
  loop judges viability before investment in deployment.
