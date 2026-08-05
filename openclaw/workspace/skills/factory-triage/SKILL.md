---
name: factory-triage
description: Investigate a failed or stuck factory run handed off by `factory-run retry` (triage tier) - gather evidence from run status, context, and logs, then either apply a clearly-indicated fix and resume the run, or post the options to the founder in the rig's Slack channel and stop. Use when a triage handoff message arrives (session factory-triage-<run_id>) or the founder asks you to triage a run.
user-invocable: true
---

# Factory Triage (failed & stuck run investigation)

A run was handed to you because a plain resume is not the answer: one was
already tried at this step, or the failure is one a resume cannot fix
(preflight failure, recovery-cap escalation, an agent's `escalation.md`, a
missing worktree). Your job is to find out WHY the run failed or stalled and
recover it — or, when the right fix is a judgement call, put the decision in
front of the founder. The engine lives at
`~/src/app-factory/orchestration/bin/factory-run`.

## The hard rule

**Never guess.** If the evidence does not clearly indicate one fix, do not
pick one. Post the options to the founder in the run's rig channel (the same
channel the run's engine notifications go to, e.g. `#factory-pace`,
`#factory-app-factory`, `#factory-app-<x>`) — what happened, the candidate
fixes with their trade-offs, and your recommendation — then STOP and wait.
And **never touch gates**: `approve`/`reject` are founder decisions; a triage
session that approves a gate has failed at its one job.

## 1. Gather evidence (always, before any action)

```sh
~/src/app-factory/orchestration/bin/factory-run status <run_id> --json   # state, step, history, recovery cycles
~/src/app-factory/orchestration/bin/factory-run context <run_id>         # per-step cost/context — where it burned
```

Then read the run dir (`~/src/app-factory/orchestration/runs/<run_id>/`):

- `engine.log` — step outcomes and the failure summary; `executor.log` for
  executor-level crashes.
- The failing step's log/documents: `checks.log`, `tests.log`, `deploy.log`,
  `<step>[.N].output.json`, and the transcript tail when an agent step died.
- `findings.md` (what validation last complained about), `escalation.md` (an
  agent already asked for a human — read it first when present),
  `conflict.md` (rebase conflict context).
- The worktree (`orchestration/worktrees/<run_id>`): `git status`/`git log`
  when the failure smells like repo state (missing worktree, dirty tree,
  half-finished rebase).

## 2. Fix and resume — only when the evidence clearly indicates it

Clearly-indicated means the log names the cause and the fix is mechanical:
a dead executor to restart, a transient network/CLI failure, a stuck rebase to
abort, a missing dependency the setup log names, a config value the preflight
probe names. Apply the fix, then:

```sh
~/src/app-factory/orchestration/bin/factory-run resume <run_id>              # restart at the current step
~/src/app-factory/orchestration/bin/factory-run resume <run_id> --step <id>  # rewind — only when the evidence
                                                                             # clearly points at an earlier step
```

Rewinding is allowed without asking only for clear cases (e.g. checks fail
because `implement` never committed — rewind to `implement`). If the rewind
would discard meaningful work or you are weighing two targets, that is a
founder decision, not a clear case.

After resuming, post one message in the rig channel: cause, fix applied,
resumed-at step. The engine's own notifications take over from there.

## 3. Otherwise: put it to the founder

One message in the rig channel, outcome-first:

- what broke (one or two sentences, from evidence — cite the log line),
- the options with trade-offs (e.g. "rewind to implement and redo ~$2 of
  work" vs "steer and resume" vs "cancel and re-scope"),
- your recommendation.

Then stop. When the founder answers, act on their instruction (`resume`,
`steer` + `resume`, or `cancel`) — their words, not your guess.

## Boundaries

- One run per session: the handoff brief names it (`factory-triage-<run_id>`).
  Do not sweep other runs while you are here.
- Never `approve`/`reject` a gate or discussion; never edit
  `gate-decision.json`.
- Never delete run dirs, worktrees, or branches; recovery must stay
  resumable. (`factory-run cleanup` is for terminal, merged runs only — not a
  triage tool.)
- Cost sanity: if the run already burned an unusual amount (see `context`),
  say so in your Slack message — the founder may prefer to cut losses.
