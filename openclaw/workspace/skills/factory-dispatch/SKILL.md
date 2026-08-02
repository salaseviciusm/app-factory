---
name: factory-dispatch
description: Decompose approved work and delegate it to an agent profile as a sub-agent session, with definition of done and review routing. Use after standup planning or founder steering.
user-invocable: true
---

# Dispatch Work

Turns a planned item ("build the paywall feature for <app>") into a delegated,
reviewable task.

## Steps

1. **Check preconditions.** The work's stage gate must be passed (e.g. no build tasks
   before spec approval). Check the app's `STATUS.md`; refuse with the reason if not.
2. **Choose the profile** (`~/src/app-factory/agents/`): product work → product-lead;
   architecture/review → tech-lead; feature implementation → app-engineer. If no active
   profile fits, do NOT invent one — either do it yourself if it's small, or propose a
   dormant-profile activation with the bottleneck named (D11).
3. **Write the task brief** into `apps/<app>/tasks/<date>-<slug>.md`:
   - objective (one sentence), spec/architecture references (file+section)
   - definition of done (code + tests + Maestro flow + analytics events, per profile)
   - reviewer (the profile's `reports_to`/lead) and any boundaries specific to the task
4. **Spawn the session**: launch a Claude Code session in the app workspace with the
   profile file + task brief as context (per O4: local sessions;
   `claude -p` for headless or an interactive session the founder can watch).
5. **Track**: add to STATUS.md "in-flight" with session start time. On completion,
   route output to the reviewing lead (spawn a review session with the tech-lead or
   product-lead profile). Only lead-approved + checks-green work moves to "done".
6. Report outcome-first in the app's Slack channel: what's done/blocked, evidence
   (commit, check run), next step.

## Constraints

- One feature-sized task per engineer session. Split anything bigger.
- Never dispatch work touching credentials, store config, or pricing — those are
  founder-gate items, staged not delegated.
