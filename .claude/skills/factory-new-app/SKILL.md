---
name: factory-new-app
description: Start the App Factory new-app workflow for a quick-fire app idea via the factory-run engine on the app-factory rig — spec refinement, market check, conversational founder spec discussion, brand pack, template stamp, and a spawned first feature-dev run on the new factory:<codename> rig. Use when asked to create a new app idea, spin up a new factory app, or run the new-app workflow.
---

# Factory new-app workflow (engine-executed)

New-app intake runs through the factory-run engine on the app-factory rig, so
spec, market check, brand, and template stamp all get run dirs, diffs, and
telemetry — no manual orchestration.

Start:

```bash
~/src/app-factory/orchestration/bin/factory-run start \
  --rig app-factory --workflow new-app --prompt "<the founder's idea, faithfully restated>"
```

Graph: refine → market-check → spec-discussion (conversational founder gate) →
brand → stamp (`template/scripts/stamp-app.sh`) → checks → deploy (merge to
main) → spawn (first feature-dev run on the new `factory:<codename>` rig,
prompted by the discussion's `first-feature.md`).

## The spec discussion

The engine posts each product-lead turn to Slack (the opening turn carries the
market-check verdict). Relay the founder faithfully with these verbs:

- Founder replies/asks/redirects:
  `factory-run reply <run_id> "<their words>"` — triggers exactly one new
  agent turn.
- Go-ahead ("build it", "approved"): `factory-run approve <run_id>`.
- Don't build: `factory-run reject <run_id> "<why>"` — the run ends in state
  `killed`. That is a SUCCESS (early kill = money saved); report it that way.
- Instructions outside the discussion: `factory-run steer <run_id> "<text>"`.

Bounds: 8 turns / 4h idle by default (per-step `maxTurns` /
`idleTimeoutMinutes`). Hitting either fails the run loudly; it never
auto-approves.

## Notes

- Stage order is engine-enforced: no brand before market check, no stamp
  without a recorded go-ahead on disk.
- The new app lands on main at deploy and is then addressable as rig
  `factory:<codename>` (quickfire tier: template checks only, no EAS deploy
  until promoted).
