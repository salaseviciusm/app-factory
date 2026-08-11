# Design: Orchestration Layer for Multi-Agent Workflows

> Status: design artifact (no implementation in this document).
> Informed by Steve Yegge's Gas Town / MEOW stack, the factory architecture in
> `01-architecture.md`, Slack surface in `06-integrations.md`, and the research
> cited in §9. Placeholders for missing inputs are listed in §10.

## 1. Goal

Create a modular orchestration layer that:

- Defines multiple workflows (for example, bug-fix, feature development).
- Executes a graph of agents for each workflow.
- Provides an orchestrator agent that can be interacted with via Slack or voice,
  reports status of work trees and agents, and can be steered to launch new
  features mid-run.
- Integrates with our existing Slack bot and supplies usable Claude/hook commands
  for each workflow.
- Supports final deployment as a downloadable update that can be installed on a
  mobile device without using an IDE.

This layer sits between the founder surface (Slack / voice) and the existing
factory subsystems (Intake & Product, Build Org, Ship Pipeline, Human Gates).
It does not replace OpenClaw as the operations brain; it gives OpenClaw durable,
graph-shaped workflows to dispatch and supervise.

## 2. Design principles (from Gas Town + research)

| Principle | Source | How we apply it |
|---|---|---|
| Orchestrator is not the coder | Gas Town Mayor / factory D1 | Chief of Staff (OpenClaw) plans and slings; coding agents execute in worktrees |
| Workflows as durable graphs | Gas Town Molecules / Formulas; GraphBit DAG engine | Each workflow is a declared DAG of steps with typed handoffs, not free-form chat |
| Nondeterministic idempotence | Gas Town NDI | Steps may be retried by fresh sessions; acceptance criteria live on the step, not in agent memory |
| Topology over model choice | AdaptOrch | Bug-fix is mostly sequential + gate; feature development is hierarchical (refine → plan → parallel implement → synthesize) |
| SOP / role specialization | MetaGPT, ChatDev | Named roles (finder, fixer, validator, planner) with structured artifacts between them |
| Deterministic gates outside the LLM | GraphBit; factory Ship Pipeline | Compilation, link checks, and CI-equivalent checks are non-LLM nodes; agentic cross-validation is a separate node with a different model |
| Human in the loop at gates | factory Human Gates | Spec agreement and ship approval remain founder-facing in Slack |

## 3. High-level architecture (text diagram)

```
 Founder
   │
   ├─ Slack message / slash / button
   ├─ Voice note (transcribed → same intake bus)
   └─ Claude slash / hook command (local coding session)
            │
            ▼
 ┌──────────────────────────────────────────────────────────┐
 │                 Orchestration Layer                      │
 │                                                          │
 │  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐ │
 │  │ Intake Bus  │──▶│ Orchestrator │──▶│ Workflow     │ │
 │  │ (normalize  │   │ Agent        │   │ Registry     │ │
 │  │  intents)   │   │ (OpenClaw    │   │ (DAG defs)   │ │
 │  └─────────────┘   │  Chief of    │   └──────┬───────┘ │
 │                    │  Staff)      │          │         │
 │                    └──────┬───────┘          │         │
 │                           │                  ▼         │
 │                    ┌──────▼────────────────────────┐   │
 │                    │ Run Engine                    │   │
 │                    │ • instantiate molecule/run    │   │
 │                    │ • assign steps to agents      │   │
 │                    │ • track worktrees / sessions  │   │
 │                    │ • mid-run steer / inject      │   │
 │                    └──────┬───────────┬────────────┘   │
 │                           │           │                │
 │              ┌────────────▼──┐   ┌────▼────────────┐  │
 │              │ Agent Graph   │   │ Validation Hub  │  │
 │              │ (roles per    │   │ agentic + det.  │  │
 │              │  workflow)    │   │ checks          │  │
 │              └────────────┬──┘   └────────┬────────┘  │
 │                           │               │           │
 │                    ┌──────▼───────────────▼──────┐    │
 │                    │ Status and Steering API     │    │
 │                    │ (Slack cards, voice reply,  │    │
 │                    │  Claude /status hook)       │    │
 │                    └─────────────────────────────┘    │
 └──────────────────────────────────────────────────────────┘
            │                         │
            ▼                         ▼
   Build Org (coding             Ship Pipeline
   agents + git worktrees)       (CI checks, EAS Build,
                                 EAS Update / TestFlight
                                 or internal-track link)
```

Mapping to Gas Town vocabulary (for readers of that article):

| Gas Town | This layer |
|---|---|
| Town | Factory (app-factory repo + OpenClaw workspace) |
| Rig | One app under `apps/<name>` |
| Mayor | Orchestrator agent (Chief of Staff) |
| Polecat / Crew | Ephemeral coding agents on a worktree |
| Hook (work hanging on an agent) | Pending step assignment for a session |
| Molecule / Formula | Workflow definition in the registry |
| Convoy | One workflow run (bug-fix or feature) with tracked steps |
| Witness / Deacon | Status reporter + stuck-run recovery (cron + orchestrator patrol) |
| Refinery + merge queue | PR merge path after Validation Hub is green (existing git/CI) |

## 4. Component list and responsibilities

### 4.1 Intake Bus

- Normalizes Slack text, slash commands, voice transcripts, and Claude hook payloads
  into a single intent schema: `{ intent, workflow?, app?, run_id?, payload }`.
- Applies channel allowlists and founder identity checks (existing Slack policy).
- Does not call models for routing decisions beyond lightweight intent classification
  when the command is ambiguous; preferred path is explicit commands (§7).

### 4.2 Orchestrator Agent

- Always-on persona: OpenClaw Chief of Staff.
- Responsibilities:
  - Start, pause, resume, cancel workflow runs.
  - Report status of work trees, agents, and step progress.
  - Accept mid-run steering ("launch feature X while bug-fix Y continues").
  - Escalate to Human Gates when a workflow definition requires founder agreement.
- Does not implement product code. Dispatches to the Run Engine.

### 4.3 Workflow Registry

- Stores named DAG definitions (bug-fix, feature-development, and future ones).
- Each node declares: role, inputs, outputs, timeout, retry policy, and whether the
  node is `agentic`, `deterministic`, or `human_gate`.
- Versioned in git under the factory (single source of truth, factory D3).

### 4.4 Run Engine

- Instantiates a registry workflow into a run (Gas Town "convoy" analogue).
- Creates or reuses a git worktree per concurrent coding step.
- Schedules agent sessions onto ready steps (respecting DAG edges).
- Supports mid-run injection: new feature-development run can be started without
  cancelling an in-flight bug-fix run (capacity limits apply; see §10).
- Persists run state to files the orchestrator can read (for example,
  `STATE.md` plus per-app `STATUS.md` and a run ledger path TBD in §10).

### 4.5 Agent Graph (roles)

Roles are workflow-scoped, not global org titles. Example role set:

| Role | Used by | Responsibility |
|---|---|---|
| Finder | bug-fix | Locates root cause; produces a bug brief |
| Fixer | bug-fix | Implements the fix in a worktree |
| Plan Analyst | feature-development | Dissects the prompt from multiple angles |
| Context Examiner | feature-development | Relates the feature to the broader app/spec |
| Refiner | feature-development | Converses with user or orchestrator until plan agreement |
| Implementer | feature-development / bug-fix | Generates and lands code for an agreed plan or fix |
| Agentic Validator | both | Separate model cross-validates result against a prompt |
| Deterministic Checker | both | Runs link checkers, compilation checks, and CI-equivalent gates |
| Shipper | both (post-green) | Triggers downloadable mobile update path (§8) |

### 4.6 Validation Hub

Two lanes, both required before a run may claim "done":

1. **Agentic validation**  
   A separate model cross-validates the result against a prompt (acceptance
   criteria or bug brief). Failure returns the run to Fixer/Implementer with
   structured feedback.

2. **Deterministic validation**  
   Exactly the class of checks you would have in a GitHub Actions workflow:
   link checkers, compilation checks, lint/typecheck/unit tests, and any other
   non-LLM gates already in the app's `check` pipeline.

### 4.7 Status and Steering API

- Surfaces to Slack (`#factory-builds`, `#factory-standup`, per-app channels).
- Surfaces to voice as short spoken summaries of the same status payload.
- Surfaces to Claude via `/factory-status` style commands and Stop/TaskCompleted hooks.
- Steering verbs: `status`, `steer`, `launch`, `cancel`, `deploy-preview`.

### 4.8 Ship Adapter (mobile downloadable update)

- Invokes the existing Ship Pipeline only after Validation Hub is green and any
  required Human Gate is passed.
- Target artifact for "install without an IDE": an EAS Update (OTA JS bundle) and/or
  a TestFlight / Play internal-track build link, as already described in
  `01-architecture.md` and `06-integrations.md`.
- Orchestrator posts the install link to Slack; founder installs on-device.

## 5. Workflows

### 5.1 Bug-fix workflow

Preserve the example steps exactly as given:

1. Finds the bug.
2. Implements a fix.
3. We have some validation checks, which are both agentic, using a separate model to cross-validate the result against a prompt, and deterministic. We have things like link checkers, compilation checks, etc., exactly what you would have in a GitHub Actions workflow with checks.

#### Agent graph (flowchart)

```
[Intake: bug report]
        │
        ▼
[Finder] ──bug brief──▶ [Fixer] ──patch + worktree──┐
                                                    │
                        ┌───────────────────────────┘
                        ▼
              ┌─ Validation Hub ─────────────────┐
              │  [Agentic Validator] (other model)│
              │  [Deterministic Checker] (CI-like)│
              └──────────────┬───────────────────┘
                     pass?   │
                no ──────────┘ (return to Fixer with findings)
                yes
                     │
                     ▼
              [Ship Adapter] ──▶ downloadable mobile update
                     │
                     ▼
              [Status: done] (+ optional Human Gate before store submit)
```

#### Pseudocode

```
function run_bug_fix(report, app):
  run = registry.instantiate("bug-fix", app, report)
  brief = agents.Finder.locate(report)          # "Finds the bug."
  patch = agents.Fixer.apply(brief)             # "Implements a fix."

  loop:
    agentic = validators.cross_model(prompt=brief, result=patch)
    determ  = validators.ci_like(patch)         # link, compile, etc.
    if agentic.ok and determ.ok:
      break
    patch = agents.Fixer.revise(patch, agentic, determ)

  artifact = ship.mobile_downloadable(patch)    # no IDE required for install
  status.publish(run, artifact)
  return run
```

### 5.2 Feature-development workflow

Initial node and interaction (required):

- Start by dissecting the prompt, examining it from multiple angles, and
  conversing with the user or a higher-level orchestrator to refine the feature
  within the broader application context.
- After agreement on a plan, the system should generate, validate, and implement
  the feature.

#### Agent graph (flowchart)

```
[Intake: feature prompt]
        │
        ▼
[Plan Analyst] ──multi-angle dissection──┐
                                         │
[Context Examiner] ──app/spec context────┤
                                         ▼
                              [Refiner ◀──▶ User or Orchestrator]
                                         │
                              agreement on plan?
                                   │ yes
                                   ▼
                              [Implementer] (may fan out subtasks)
                                   │
                                   ▼
                              Validation Hub
                              (agentic + deterministic)
                                   │
                              pass ──▶ [Ship Adapter]
                                   │
                              fail ──▶ Implementer (with findings)
```

#### Pseudocode

```
function run_feature_development(prompt, app):
  run = registry.instantiate("feature-development", app, prompt)
  angles  = agents.PlanAnalyst.dissect(prompt)
  context = agents.ContextExaminer.examine(app.spec, angles)
  plan    = agents.Refiner.converse(user_or_orchestrator, angles, context)
  await human_or_orchestrator_agreement(plan)   # gate

  artifact = agents.Implementer.generate(plan)
  loop:
    agentic = validators.cross_model(prompt=plan, result=artifact)
    determ  = validators.ci_like(artifact)
    if agentic.ok and determ.ok:
      break
    artifact = agents.Implementer.revise(artifact, agentic, determ)

  mobile = ship.mobile_downloadable(artifact)
  status.publish(run, mobile)
  return run
```

### 5.3 Mid-run steering

While any run is active, the Orchestrator may:

- Accept `launch feature <desc>` and start a second feature-development run on a
  separate worktree / capacity slot.
- Accept `steer <run_id> <instruction>` to amend the active plan or bug brief
  (Refiner or Finder re-enters; downstream steps invalidate if inputs changed).
- Accept `status` and return worktree paths, agent session ids, step states, and
  last validation outcomes.

Capacity and conflict rules are placeholders in §10 (for example, max concurrent
runs per app, branch naming).

## 6. Slack and voice integration

### 6.1 Slack (existing bot environment)

Reuse the factory Slack surface from `06-integrations.md`:

| Trigger | Channel / surface | Behavior |
|---|---|---|
| Natural language to Chief of Staff | DM / `#factory-standup` | Intake Bus classifies; Orchestrator confirms workflow |
| Slash (Phase 3 Bolt, or OpenClaw skill today) | any allowlisted channel | `/factory bugfix …`, `/factory feature …`, `/factory status` |
| Thread reply on a run message | `#factory-builds` or per-app | Steering / plan refinement for that `run_id` |
| Approval buttons | `#factory-approvals` | Human Gates for plan agreement and ship |

Message contract (design-level fields):

- `run_id`, `workflow`, `app`, `step`, `worktree`, `agents[]`, `validation`, `artifact_url`

### 6.2 Voice note triggers

Pipeline (design only; no external service calls in this doc):

1. Voice note arrives on the founder surface (Slack voice clip and/or WhatsApp,
   depending on which channel OpenClaw has enabled).
2. Transcription service produces text (provider choice: §10 placeholder).
3. Transcript enters the Intake Bus as if it were a typed Slack message.
4. Orchestrator replies with a short confirmation ("starting bug-fix on app X")
   and continues to post status cards to Slack; optional TTS summary for voice
   channels when a run completes or blocks.

Voice is an alternate ingress, not a separate orchestrator.

## 7. Claude / hook command examples

Two complementary surfaces, both required by the ask:

1. **Claude Code slash commands / skills** (invoked in a coding session).
2. **Lifecycle hooks** that keep local Claude sessions aligned with the Run Engine
   (Gas Town "work on your hook" idea + Claude Code `TaskCompleted` / `Stop` hooks).

### 7.1 Bug-fix pipeline commands

```text
/factory-bugfix <app> <report>
  → Orchestrator starts bug-fix molecule; Finder then Fixer on a worktree.

/factory-bugfix-status <run_id>
  → Prints step graph, worktree path, validation lane results.

/factory-validate <run_id>
  → Forces Validation Hub (agentic + deterministic) without advancing ship.
```

Example hook policy (settings-level, illustrative):

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "matcher": "factory-bugfix",
        "hooks": [
          {
            "type": "command",
            "command": "factory-run check-step --from-stdin"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "If this session is a Fixer for an open bug-fix run, verify the bug brief acceptance criteria still hold before allowing idle."
          }
        ]
      }
    ]
  }
}
```

### 7.2 Feature-development pipeline commands

```text
/factory-feature <app> <prompt>
  → Starts Plan Analyst + Context Examiner; opens Refiner thread in Slack.

/factory-feature-agree <run_id>
  → Records plan agreement (user or Orchestrator) and unlocks Implementer.

/factory-feature-implement <run_id>
  → Generate → validate → implement loop after agreement.

/factory-steer <run_id> <instruction>
  → Mid-run amendment; may invalidate Implementer outputs.
```

### 7.3 Shared status / deploy commands

```text
/factory-status [--app <name>] [--run <id>]
  → Work trees, agents, step states (Slack-equivalent payload).

/factory-deploy-preview <run_id>
  → After green Validation Hub: request downloadable mobile update (§8).
```

## 8. Deployment procedure (mobile downloadable update, no IDE)

Goal stated in the ask: final deployment as a downloadable update installable on a
mobile device without using an IDE.

Procedure (design steps; uses existing Expo/EAS Ship Pipeline):

1. Validation Hub reports green (agentic + deterministic).
2. If the workflow definition requires it, Human Gate in `#factory-approvals`
   (submission approval).
3. Ship Adapter requests:
   - **Preferred for agent-written JS fixes:** EAS Update on the app's preview or
     production OTA channel (install by opening the app / update URL; no Xcode or
     Android Studio).
   - **When a native binary is required:** EAS Build → TestFlight (iOS) or Play
     internal track (Android); founder installs from the store testing link.
4. Orchestrator posts the install link and run summary to `#factory-builds` and
   the per-app channel.
5. Founder installs on a physical device; no IDE involved on the founder path.

Out of scope for this design (see §10): store listing copy, credential custody
details beyond "CI/EAS layer only" (already factory policy).

## 9. Research references

Primary narrative source for this design:

- Steve Yegge, *Welcome to Gas Town* (2026): Mayor/polecat roles, hooks, molecules,
  formulas, convoys, GUPP, nondeterministic idempotence, merge-queue Refinery.
- Gas Town repository concepts (MEOW, Beads, Witness/Deacon, Refinery).

Multi-agent orchestration and software-team papers consulted:

- Hong et al., *MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework*
  (arXiv:2308.00352): SOPs and role assembly lines.
- Qian et al., *ChatDev: Communicative Agents for Software Development*
  (arXiv:2307.07924): chat-chain design/code/test phases.
- Li et al., *CAMEL: Communicative Agents for "Mind" Exploration of Large Scale
  Language Model Society* (NeurIPS 2023): role-play grounding.
- *GraphBit: A Graph-based Agentic Framework for Non-Linear Agent Orchestration*
  (arXiv HTML 2605.13848): engine-orchestrated DAGs vs prompted routing;
  deterministic gates; multi-tier memory.
- *AdaptOrch: Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance
  Convergence* (arXiv:2602.16873): topology selection (sequential / hierarchical /
  hybrid) as first-class.
- *LLM-Based Multi-Agent Orchestration: A Survey of Frameworks, Communication
  Protocols, and Emerging Patterns* (MDPI Future Internet, 2026): centralized /
  hierarchical topologies; MCP/A2A protocol stack context.
- Anthropic Claude Code docs: Agent Teams, Hooks, slash commands / skills
  (command and hook patterns for §7).

Placeholder for additional papers the founder wants forced into the next revision:

> **[FILL: relevant research papers]**  
> Add any further citations here (Slack UX studies, voice-ASR reliability, OTA
> update ops, Temporal/Kubernetes comparisons Yegge references, MAKER long-horizon
> workflows, etc.) before implementation lock.

## 10. Placeholders (additional information needed)

| ID | Missing input | Blocks |
|---|---|---|
| P1 | Exact Claude/hook command syntax preferred by the founder (skills vs `.claude/commands` vs Gas Town `gt` CLI if adopted) | Finalizing §7 as installable configs |
| P2 | Voice transcription provider and which founder surface receives voice notes first (Slack vs WhatsApp) | §6.2 implementation |
| P3 | Run ledger persistence format and path (Beads-like vs factory markdown vs SQLite) | Durable NDI across OpenClaw restarts |
| P4 | Max concurrent runs / worktrees per app; branch naming convention | Mid-run feature launch safety |
| P5 | Whether Validation Hub deterministic checks are only `npm run check` or a stricter Maestro + link-check matrix per app | Gate definitions |
| P6 | Agentic validator model id and prompt templates per workflow | Cross-model lane |
| P7 | Whether Gas Town itself is adopted as the Run Engine or we implement a thinner molecule runner inside the factory | Build vs buy for §4.4 |
| P8 | Phase timing: OpenClaw skills now vs Phase 3 Bolt slash commands | Slack command surface |
| P9 | OTA channel policy (preview vs production) for agent-shipped updates | §8 defaults |
| P10 | **[FILL: relevant research papers]** extras beyond §9 | Literature completeness |

## 11. Execution checklist (design coverage)

- [x] Include bug-fix workflow steps exactly as listed.
- [x] Describe validation checks (agentic model cross-validation, deterministic link/compilation checks).
- [x] Outline feature-development initial node and user/orchestrator interaction.
- [x] Provide Slack and voice-note trigger mechanisms.
- [x] Supply Claude/hook command examples.
- [x] Detail mobile-downloadable deployment process.
- [x] Reference placeholder for research papers.

## 12a. Self-evaluation loop (implemented 2026-08-03)

The factory improves itself through the same graph machinery it uses for apps.

**Structured telemetry plus captured context.** Every run writes structured
records to `orchestration/telemetry.db` (SQLite via `node:sqlite`, zero
dependencies):

- `runs`: id, workflow, rig, prompt, state, parent run, timestamps
- `steps`: per-attempt outcome, summary, duration (implement loops visible as
  attempts), and per-agent-step **cost/tokens** (`cost_usd`, `input_tokens`,
  `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`) parsed from each
  step's result envelope (reconstructed from its stream-json transcript)
- `artifacts`: commits (sha + subject), review verdicts, review findings,
  deploy/artifact URLs, harness merge commits

Alongside the structured rows, every agent step streams its **full working
transcript** (`claude --output-format stream-json --verbose`, stdout fed to a
file descriptor so MB-scale transcripts survive timeouts and kills) to
`<step>[.N].transcript.jsonl` in the run dir. The prior single-object envelope
is reconstructed from the transcript's `"type":"result"` event into
`<step>[.N].output.json`, so `parseUsage`, the report backfill, and the web
console are unchanged; when a timeout/kill leaves no result event, usage falls
back to the last assistant event's `message.usage` so failed attempts are still
priced. `factory-run context <run_id> [--json]` turns this into a per-step
context/cost report (prompt bytes, steering/findings injections, tokens by
category, cost, duration, assistant turns, tool_use counts, models, steps
ranked by cache-read tokens), and `factory-run context --sessions
[--sessions-dir <dir>] [--days N]` inventories the OpenClaw session transcripts
(founder ↔ OpenClaw conversations) so the self-review loop can sample them.

**Cost/token accounting (for effort tuning).** Agent-step cost and token counts
are captured into `steps` as each step completes. They surface in three places,
so the founder never has to dig through run dirs:
- **End of workflow**: the completion Slack message (and the FAILED message)
  append a line — `Cost $X · tokens in N (M cached) / out K · S agent step(s)`.
- **On a status request**: `factory-run status [<id>]` prints the same per-run
  usage line (the `factory-feature` skill relays it).
- **In the report**: `factory-run report` shows a grand total, a per-run
  cost/token column, and a per-step table with avg cost and total cost — the
  primary signal for tuning model/effort choices per step.

`factory-run report [--days N] [--json]` renders the digest (totals, run table
with cost, step failure/duration/cost stats, recent findings, recent artifacts)
and backfills any pre-telemetry runs from their run dirs — engine.log step lines,
review.json, and per-step cost/tokens from the `*.output.json` files on disk.

**Self-review workflow** (`workflows/self-review.json`, worktree-less: it reads
the live checkout):

```
[analyze] agent node (self-reviewer prompt)
    reads: factory-run report, run dirs (prompts as given, review verdicts,
    engine logs), the harness source itself
    writes: improvement-plan.md - evidence, ONE improvement, acceptance
    criteria, risk/rollback, backlog
        |
        v
[plan-gate] founder conversation in Slack (chief of staff relays; approve /
    reject / steer)
        |
        v
[spawn] launches a FULL feature-dev graph execution (child run) on the
    app-factory rig with the approved plan as its feature request:
    implement -> checks (engine syntax + selftest + script lint) ->
    cross-model review -> deploy (opens the PR) -> awaiting-merge
```

**Harness-restart deploy** (rig `app-factory`, tier production): the run is
PR-gated like every rig — the deploy step opens a GitHub PR from the validated
`factory/<run_id>` branch and the run parks `awaiting-merge`. After the founder
merges the PR, `factory-run sync <run_id>` flips the run done AND restarts the
OpenClaw gateway (plus the web console when the merge touched it), gated on the
rig checkout actually containing the merge commit (fetched first; if the local
main hasn't pulled the merge, sync degrades to an actionable message — the
engine never pushes or pulls the default branch). Rollback is `git revert
<merge_sha>` + gateway restart. The spawned child run skips its own plan gate
(the founder approved the improvement plan already); all validation still
applies.

**Cadence:** weekly cron (`factory-weekly-self-review`, Sundays 17:00) plus
on-demand via the `factory-self-review` skill ("review how the factory is doing").

## 12b. Preflight: external-CLI contract checks (implemented 2026-08-03)

Both live bugs in the smoke run were the same failure class: `factory-run`
shells out to external CLIs (`openclaw message send`, `eas update`) with
hand-written argument lists that were first validated in production. Preflight
exercises those exact contracts before any token is spent.

**Probes** (all read-only — nothing is sent to Slack, nothing is published):

- `notify:openclaw-send-contract` — cross-checks `openclaw message send`
  against the engine's real notify argv (built by the same `notifyArgs()`
  helper `notify()` sends with, so the probe cannot drift). Every long
  `--flag` the engine passes must appear in `--help` output, and every
  required option must be covered by the engine's argv. Required-ness is
  derived empirically, not from help prose (openclaw's `--target` line
  carries no "required" marker): the probe invokes the command under
  `--dry-run` (payload printed, nothing sent) and satisfies each
  `Missing required option` error with a dummy value until the CLI stops
  raising them, plus any option whose own help line carries a "required"
  marker (catches `-m/--message`). The probe fails loudly if `--dry-run`
  disappears from the help or the dry-run pass confirms zero required
  options — both mean the probing mechanism itself broke.
- `claude:version` — `claude --version` must exit 0.
- Per rig with `deploy.type: "eas-update"`, executed in the rig's live app
  directory: `npx eas whoami --non-interactive` (authenticated, exit 0),
  `npx eas update --help` (must contain every publish flag from the shared
  `easPublishArgs()` helper that the real deploy step sends with), and
  `npx eas update:list --branch <branch> --limit 1 --non-interactive --json`
  (exit 0 and JSON-parseable output). Rigs with deploy type `none` or
  `harness-restart` get no EAS probes.

**Automatic run-start invocation:** the executor runs the rig's preflight at
the top of every run — before worktree setup, so resumes re-verify too. A
failure sets the run `failed` with a summary starting `preflight failed:`
before any agent step runs, and is recorded as a normal telemetry step
(`step_id` `preflight`), so `report` shows it. Related fail-loud change:
`notify()` now reports send success, and an undeliverable plan-gate
notification ends the run terminally (naming the notify failure) instead of
silently waiting 12 h on a gate the founder never saw.

**Standalone command:** `factory-run preflight [--rig <name>]` probes one rig
(default: all registered rigs), prints one line per probe (ok/FAIL plus
detail), and exits non-zero on any failure.

**Escape hatch:** `FACTORY_RUN_NO_PREFLIGHT=1` skips the run-start preflight
(engine tests, offline work). The standalone command always runs.

## 12c. Human-readable run ids with prefix resolution (implemented 2026-08-04)

Run ids are minted as `<workflow-prefix>-<task-slug>` (e.g.
`feature-version-badge`, `bug-leaked-sockets`): the slug is derived from the
run prompt by a pure heuristic in `createRun()` (lowercase, `[a-z0-9-]` only,
stopwords dropped, first few meaningful words, capped at a word boundary), a
numeric suffix (`-2`, `-3`, …) is appended only when the run dir already
exists, and prompts with no usable words fall back to the legacy
`<prefix>-<base36>` shape. Worktree paths, `factory/<id>` branches, telemetry
rows, and Slack messages all derive from the minted id, so nothing else
changes. On the read path, every CLI verb that takes an id (`status`,
`resume`, `approve`, `reject`, `steer`, `cancel`) resolves its argument via
exact match → unique id-prefix → unique substring, so any unambiguous
fragment (`version-badge`) addresses a run; ambiguous fragments error listing
all candidates, and `exec` (internal) stays exact-only. Legacy base36 ids are
plain run-dir names and keep working with zero migration.

## 12d. Worktree/branch cleanup (implemented 2026-08-04)

Every run creates `orchestration/worktrees/<id>` plus a `factory/<id>` branch
in its rig repo, and each worktree carries full rig setup (~1–2 GB). Cleanup
reclaims both, two ways:

- **At run completion:** after a run reaches a green terminal state, the
  executor calls cleanup for that run (wrapped so a cleanup failure can never
  change the terminal state). Every rig is PR-gated, so the branch is unmerged
  at completion — cleanup skips and the "worktree kept for merge review" flow
  is preserved; the reclaim happens on the next cleanup after the PR merges.
- **On demand:** `factory-run cleanup [--dry-run] [--json]
  [--remove-unmerged-worktrees]` sweeps every run plus an orphan scan of the
  worktrees dir, printing per-item action/skip reason and a freed-bytes total.

Safety rules: a run is only cleaned when terminal (`done`/`failed`/
`rejected`/`cancelled`/…), its worktree has no uncommitted changes, and its
branch is merged — checked against the run's own rig repo (multi-rig
correct). Merge truth for runs with a recorded PR is GitHub's (`gh pr view`,
after a `git fetch origin`): a squash/rebase-merged PR never makes
`factory/<id>` a local ancestor of the default branch, so the provably-merged
branch is deleted with `git branch -D`; runs without a PR keep the
conservative local ancestor check and `git branch -d`. Worktree removal is
never forced (`git worktree remove` without `--force`), an unmerged-PR run is
always skipped, clean worktrees on unmerged branches are only removed with
`--remove-unmerged-worktrees` (branch always kept), and the orphan scan
deletes a worktree directory only when its `.git` gitdir pointer is missing or
dangling; a valid worktree of any rig repo is never classified as an orphan
(without a `run.json` it is reported, not touched).

## 12e. PR-gated merges everywhere; the sync-time harness restart (2026-08-11; supersedes deploy-step merge-conflict recovery)

Until 2026-08-11 this section described the deploy-time auto-merge
(`policy.merge: "auto"`) and its base-drift rebase/conflict-resolution
recovery loop. Both are gone (decision D31): the auto path merged into the
rig's **local** default branch and nothing ever pushed, so "done, merged to
main" runs silently left local main ahead of origin. Every rig is now
PR-gated:

- A green run's deploy step opens (or idempotently reuses) a GitHub PR from
  `factory/<id>` and the run parks `awaiting-merge`. Merging is GitHub's job —
  concurrent-run base drift and conflicts are handled by the PR (GitHub
  reports mergeability; the founder or a follow-up run resolves conflicts),
  so the engine carries no deploy-time rebase machinery.
- `factory-run sync <id>` (or the console's Sync button) is the only exit
  from `awaiting-merge`; `factory-run sync --all` sweeps every awaiting-merge
  run, one line per run, without aborting on a single failure. Runs recorded
  before PR gating (no `run.pr`) get an actionable "unsyncable" message
  naming the branch and the manual resolution instead of a bare refusal.
- On `harness-restart` rigs (app-factory), sync's `done` path also restarts
  the OpenClaw gateway — and rebuilds/restarts the web console when the merge
  touched it — gated on the rig checkout containing the merge commit after a
  `git fetch origin`. A checkout that hasn't pulled the merge degrades to a
  "pull, then restart manually" message; the engine never pushes or pulls a
  default branch.
- Legacy `run.recovery` bookkeeping in old run.json files is still displayed
  by `factory-run status` (marked legacy) but is never written again.
- **Rewind on resume**: `factory-run resume <id> --step <step-id>` restarts a
  non-terminal run from any earlier (or the current) step; a later-than-current
  or unknown step id is rejected. `--back` rewinds one step. Plain `resume`
  still resumes at the failed step.

## 12f. Retry for failed & stuck runs, with OpenClaw triage escalation (implemented 2026-08-05)

Recovery used to mean SSH + `factory-run resume`. Now it is one founder action
— `factory-run retry <run_id> [--force]` on the CLI, a Retry button on the web
console's run detail page (`POST /api/runs/<id>/retry`, token-gated,
rate-limited, audited like every mutation; 409 with the classifier's reason
when ineligible) — with the policy in the engine so Slack/CLI/web all behave
identically.

- **Two tiers, one command**: the classifier
  (`web/lib/retry.mjs::classifyRetry`, pure, shared by engine + server + tests
  via the discussion.mjs require(esm) pattern) picks the tier; the UI states
  which one will run. Tier **resume** — first retry at the current step —
  plain-resumes the run. Tier **triage** — a retry was already tried at this
  step, or the failure is one a resume cannot fix (preflight failure,
  `escalation.md` present, missing worktree) —
  dispatches a fire-and-forget OpenClaw session (`openclaw agent --agent main
  --session-id factory-triage-<run_id> -m <evidence brief>`, stdin detached)
  whose `factory-triage` skill gathers evidence and either applies a
  clearly-indicated fix and resumes, or posts the options to the founder in
  the rig channel and stops — never guesses, never touches gates. When the
  `openclaw` CLI is absent the exact dispatch is logged instead. Each retry is
  recorded in `run.json` (`retries: [{at, tier, step}]`) plus a history entry;
  triage handoffs also Slack-notify. A second triage dispatch for the same
  step is refused (pointer to the open session) until the run moves again.
- **Stuck ≠ failed**: a non-terminal run (not `awaiting-approval`) with no
  state update for >10 minutes counts as stuck and is retryable; terminal
  successes (`done`/`cancelled`/`killed`), `rejected`, gate-parked, and
  recently-updated runs are refused with the reason.
- **Executor pid guard (closes the double-execute hazard)**: `detachExec`
  records the executor pid in the run dir (`executor.pid`); liveness is
  verified against the pid's live `ps` command line (`… factory-run exec
  <run_id>`), so a recycled pid never counts — and is never killed. Retrying
  a run whose executor is still alive fails naming the pid unless `--force`
  (web: confirm dialog) is given, which SIGTERMs (SIGKILL fallback) the old
  executor before resuming. `resume` gained the same guard: it refuses when a
  live executor exists, pointing at `retry --force`.

## 12g. factory-retro: weekly harness retrospective with a living backlog (implemented 2026-08-06)

Self-review started every cycle from a cold telemetry read, and the daily
standup kept re-surfacing the same top observation because nothing durable
recorded it. `factory-retro` is the factory's memory of harness observations.

**Workflow** (`workflows/factory-retro.json`, rig `app-factory`,
`"worktree": false` like self-review — it works in the live checkout): one
agent step `retro` (prompt `retro-analyst`, 30 min) then a `notify` step. No
gates, no deploy, no spawned runs; it changes no app code. Cadence is manual —
`factory-run start --rig app-factory --workflow factory-retro --prompt "..."` —
no cron is wired (founder decides cadence separately).

**What the retro step does:** digests the last 7 days of run evidence —
`factory-run report --days 7 --json`, the run dirs of runs that reached a
terminal state in the window (`engine.log`, `findings.md`, `escalation.md`),
`factory-run context <run_id>` for per-step cost on outliers — and maintains
`docs/process/harness-backlog.md`.

**The backlog file contract** (`docs/process/harness-backlog.md`): one ranked
living file, most valuable open item first. Items are `## R<N> — <title>`
blocks with a Status (`open` | `accepted` | `declined` | `done`), an
Observation carrying evidence (run id plus step, cost, or review cycles), a
Proposed change, and a Rough cost to try. Append-aware rules mirror the
decision log: append new items, update Status/evidence in place, never delete
or renumber. The retro reconciles statuses against
`docs/process/decision-log.md` — an item the founder declined is marked
`declined (see D<n>)` and is never re-raised as a new open item. The agent
commits only the backlog file, directly to `main` (same trust level as
appending to the decision log); no commit when the window changed nothing.

**Summary notification:** the retro writes a short `retro-summary.md` into the
run dir (window stats, top open items, status changes), and the notify step
posts it via the step's `summaryFile` field — a notify step with `summaryFile`
posts that run-dir file's contents (plus the usage line) instead of the
default merge/deploy-flavoured completion message; without the field the
message is byte-identical to before (`classifyNotifyMessage`, selftest-pinned).

**Feed into self-review:** the self-reviewer prompt reads the backlog as
evidence source 1 and starting ranking — open items first, `declined` items
excluded — and its improvement plan names the `R<N>` item it takes.
`workflows/self-review.json` itself is unchanged.

## 12h. Stale-run watchdog (implemented 2026-08-06)

Nothing used to watch runs *between* state changes: feature-msdpir37 sat
`failed` for three days with $31.70 spent and nobody was told. `factory-run
watchdog [--hours N] [--cooldown-hours N] [--dry-run] [--json]` is a
cron-friendly scan that finds runs sitting quiet past a threshold and posts
one outcome-first Slack message per stale run to its rig channel (standard
`notify()` routing: per-rig channel created on demand, global fallback). It
reports and suggests only — remediation stays a founder action.

- **Policy lives in a pure core** (`web/lib/watchdog.mjs`, engine-wired via
  the retry.mjs require(esm) pattern, covered by `watchdog.test.mjs` and
  selftest). The activity clock is `run.updatedAt` — `setState` stamps it on
  every transition, so no new bookkeeping.
- **Two threshold tiers, one override**: engine-active states (`queued`,
  `setup`, `approved`, `running:*`, `deploying`, `recovering`) alert after
  **6h** of silence — the agent step timeout is 90 minutes, so 6 quiet hours
  means a dead executor. Founder-wait and resumable states
  (`awaiting-approval`, `awaiting-merge`, `failed`, and `done` with a held
  deploy) alert after **24h**. `--hours N` overrides both tiers uniformly.
  Never alerted: released `done`, `killed`, `cancelled`, `rejected` — settled
  outcomes, not silence.
- **De-duplication**: each successful alert records a snapshot
  (`runs/<id>/watchdog.json`: state, stepIndex, updatedAt, alertedAt). While
  the snapshot still matches, the run is not re-alerted until the cooldown
  (default 72h, `--cooldown-hours N`) elapses; any movement — state or step
  change, or `updatedAt` advancing (the run woke up and re-stalled) —
  re-alerts immediately. A failed Slack send leaves the snapshot unwritten so
  the next scan retries.
- **The message** carries the run id, rig, state, current step, quiet
  duration, the telemetry cost line, and a concrete next action derived from
  the state: `failed`/silent-active → `factory-run retry <id>` (retry itself
  picks resume vs triage), `awaiting-approval` → approve/reject/reply,
  `awaiting-merge` → merge `factory/<id>` then cleanup, held deploy →
  `factory-run deploy <id>`.
- **Cron-safe**: no TTY needed, exit 0 whether or not stale runs were found
  and alerted (a completed scan is a success; only a usage error exits 1).
  Recommended schedule, hourly:

  ```
  0 * * * * /Users/morkus/src/app-factory/orchestration/bin/factory-run watchdog >> /Users/morkus/src/app-factory/orchestration/watchdog.log 2>&1
  ```

## 12. Non-goals (this document)

- No production code that accesses Slack, voice APIs, EAS, or model providers.
- No change to the wording of the example bug-fix list.
- No new domain product requirements beyond the ask and existing factory docs.
