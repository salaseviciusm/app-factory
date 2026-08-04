---
description: Show App Factory orchestration status - runs, gates, executor health, Slack connectivity
argument-hint: [run_id | report | health]
---

Follow the factory-status skill at `.claude/skills/factory-status/SKILL.md`.

Request: $ARGUMENTS

- No arguments: run `~/src/app-factory/orchestration/bin/factory-run list`, check
  executor processes for any `running:*` runs, and summarize active runs, pending
  approvals, and recent completions/failures.
- A run id: run `factory-run status <run_id>` and summarize its history and cost.
- `report`: run `factory-run report` and summarize the telemetry digest.
- `health`: check `openclaw gateway status`, `openclaw channels status`, and the
  latest `Inbound` lines in `/tmp/openclaw/openclaw-<date>.log`.
