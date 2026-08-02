---
name: factory-status
description: Answer "where are things?" — factory phase, per-app stage, in-flight work, pending gates. Use for any status question from the founder at any time of day.
user-invocable: true
---

# Factory Status

## Steps

1. Read `~/src/app-factory/STATE.md` and each active app's `STATUS.md`.
2. Verify claims against reality where cheap: in-flight tasks against recent git log /
   session records; "green" claims against the latest check run. Report discrepancies
   as discrepancies, not as the optimistic version.
3. Answer at the altitude of the question: "how's <app>?" gets that app's stage,
   what's moving, what's blocked, next gate. "How are things?" gets the portfolio in
   ≤6 lines. Lead with the outcome; don't dump both files.
4. If the founder's question implies a steering change ("why is X not done yet?" often
   does), surface the choice explicitly: current plan vs the implied alternative, with
   your recommendation.

## Constraints

- Never present unverified sub-agent claims as fact — attribute them
  ("engineer session reports X; review pending").
- If STATE.md is stale relative to reality, fix it as part of answering and say so.
