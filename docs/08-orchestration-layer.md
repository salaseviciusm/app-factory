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

**Telemetry, not context dumps.** Every run writes structured records to
`orchestration/telemetry.db` (SQLite via `node:sqlite`, zero dependencies):

- `runs`: id, workflow, rig, prompt, state, parent run, timestamps
- `steps`: per-attempt outcome, summary, duration (implement loops visible as
  attempts), and per-agent-step **cost/tokens** (`cost_usd`, `input_tokens`,
  `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`) parsed from each
  step's `claude --output-format json` result
- `artifacts`: commits (sha + subject), review verdicts, review findings,
  deploy/artifact URLs, harness merge commits

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
    cross-model review -> harness-merge deploy
```

**Harness-merge deploy** (rig `app-factory`, tier production): merges the
validated `factory/<run_id>` branch into main and restarts the OpenClaw gateway,
so skills and engine reload immediately - the improvement is live. Rollback is
`git revert -m 1 <merge_sha>` + gateway restart. The spawned child run skips its
own plan gate (the founder approved the improvement plan already); all validation
still applies.

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
  `harness-merge` get no EAS probes.

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

- **At run completion:** after a run reaches `done`, the executor calls
  cleanup for that run (wrapped so a cleanup failure can never change the
  terminal state). On harness-merge rigs the deploy step already merged the
  branch, so the worktree and branch are reclaimed immediately; on
  manual-merge rigs the branch is unmerged at completion, so cleanup skips and
  the "worktree kept for merge review" flow is preserved.
- **On demand:** `factory-run cleanup [--dry-run] [--json]
  [--remove-unmerged-worktrees]` sweeps every run plus an orphan scan of the
  worktrees dir, printing per-item action/skip reason and a freed-bytes total.

Safety rules: a run is only cleaned when terminal (`done`/`failed`/
`rejected`/`cancelled`), its worktree has no uncommitted changes, and
`factory/<id>` is an ancestor of the rig's default branch — checked against
the run's own rig repo (multi-rig correct). Deletion is never forced: `git
worktree remove` without `--force` and `git branch -d` (never `-D`). Clean
worktrees on unmerged branches are only removed with
`--remove-unmerged-worktrees`, and the branch is always kept. The orphan scan
deletes a worktree directory only when its `.git` gitdir pointer is missing or
dangling; a valid worktree of any rig repo is never classified as an orphan
(without a `run.json` it is reported, not touched).

## 12e. Deploy-step merge-conflict recovery (implemented 2026-08-04)

Runs execute in parallel, so by the time a run reaches its harness-merge
deploy another run may have landed on the base branch. The deploy step never
attempts a stale-base merge: it first compares the base branch head with the
run branch's merge-base, and on drift rebases the run branch onto the base
**inside the worktree**, then loops the pipeline back to the deploy step's
`onRecover` target (`"checks"` in feature-dev/bug-fix) so the gates re-run
against the new base before any merge. Rigs with `eas-update` or `none`
deploys are unchanged (their merge is manual/absent).

- **Clean rebase** (no textual conflicts): only the deterministic gates
  re-run — `checks` and `tests` — while the agentic `review` step is skipped
  (recorded as an ok step row with a "review skipped" summary), per founder
  steering: no code changed, so the review verdict stands and no tokens are
  burned. The skip is dropped the moment any other agent step runs again
  (e.g. a checks failure looping back to `implement`).
- **Conflicted rebase**: the engine writes `conflict.md` into the run dir
  (conflicting files/hunks + the base-side commits since the branch point)
  and spawns the engine-synthetic `resolve-conflicts` agent step (prompt
  `conflict-resolver.md`) through the normal agent-step machinery, so its
  rendered prompt / raw output / telemetry / attempt numbering come for
  free. The agent resolves each conflict preserving both sides' intent and
  completes the rebase; it may never `--skip` or drop commits. The engine
  verifies completion (no in-flight rebase, clean tree, HEAD contains the
  rebase target) before looping back through the **full** gate set,
  review included.
- **Escalation**: on any judgement call (semantic conflicts, contradictory
  intent, potential work loss, a commit that could only be dropped) the agent
  aborts the rebase and writes `escalation.md`; the engine Slack-notifies its
  content, sets the run `failed`, and leaves the worktree/branch intact —
  `factory-run resume` restarts it. The same posture applies when the cap is
  reached.
- **Bounded + persistent**: recovery state lives in `run.json`
  (`recovery.iterations` plus one attempt entry per cycle: timestamp,
  drifted-from/to SHAs, conflicted/clean, outcome), so engine restarts and
  resumes cannot reset the counter. The loop is capped at 5 cycles; each
  cycle also appears in the run history (state `recovering`) and telemetry
  records the deploy row with status `recover` (not `fail`, keeping failure
  stats honest). `factory-run status <id>` prints the cycle count, and the
  web console shows the recovery panel (cycles, conflict/escalation docs,
  resolve-conflicts prompt/output viewers).
- **Rewind on resume**: `factory-run resume <id> --step <step-id>` restarts a
  non-terminal run from any earlier (or the current) step; a later-than-current
  or unknown step id is rejected. `--back` rewinds one step. Plain `resume`
  still resumes at the failed step.

## 12. Non-goals (this document)

- No production code that accesses Slack, voice APIs, EAS, or model providers.
- No change to the wording of the example bug-fix list.
- No new domain product requirements beyond the ask and existing factory docs.
