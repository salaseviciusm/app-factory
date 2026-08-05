---
name: factory-new-app
description: Start the product process for a new app idea via the factory-run engine — spec refinement, market check, conversational founder spec discussion, brand pack, and template stamp, ending in a spawned first feature-dev run. Use when the founder shares an app idea.
user-invocable: true
---

# New App Intake (engine-executed)

Input: the founder's idea, however rough ("what about a tip-splitting app?").

## Steps

1. **Clarify before starting.** If the idea is ambiguous about audience or intent, ask
   1–3 decision-shaped questions first (with defaults). Do not start runs for ideas
   you don't understand — a wrong assumption here invalidates everything after.
2. Start the engine-executed workflow (it owns codename, workspace, spec, market
   check, brand, and stamp — with run dirs, diffs, and telemetry):

   ```sh
   ~/src/app-factory/orchestration/bin/factory-run start \
     --rig app-factory --workflow new-app --prompt "<the founder's idea, faithfully restated>"
   ```

   Tell the founder the run id; the market-check verdict and spec summary arrive in
   Slack as the discussion opens.
3. **Relay the spec discussion.** The engine posts each product-lead turn to
   #factory-builds and waits. Map the founder's words to verbs:
   - a reply, question, or redirection → `factory-run reply <run_id> "<their words>"`
     (triggers exactly one new agent turn);
   - go-ahead ("build it", "approved") → `factory-run approve <run_id>`;
   - don't build → `factory-run reject <run_id> "<why>"` — the run ends in state
     `killed`, which is a success (money saved), and you report it that way;
   - instructions outside the discussion → `factory-run steer <run_id> "<text>"`.
   Bounds are loud: 8 turns / 4h idle by default; hitting either fails the run with
   an explicit notification — it never auto-approves.
4. After the go-ahead the engine finishes on its own: brand pack, template stamp,
   checks, merge to main, then a spawned feature-dev run building the first feature
   (from the discussion's `first-feature.md`) on the new rig `factory:<codename>`.

## Constraints

- Stage order is engine-enforced and not skippable: no brand work before a recorded
  market check; no stamp without the founder's go-ahead on disk.
- If the market check's verdict is "don't build," the discussion says so in its
  opening message — killing ideas early is a success, not a failure.
