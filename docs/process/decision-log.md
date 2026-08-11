# Decision Log — App Factory

Factory-wide decisions. Per-app decisions live in each app's spec repo. Format is
deliberately light; promote to a full ADR (skip-hero style, with anti-instructions)
anything a future agent might "helpfully" undo.

---

## D1 — OpenClaw is the orchestrator, not the engine (2026-08-02)

**Context:** Initial framing was "use OpenClaw for everything" — codegen, pipelines, marketing.
**Decision:** OpenClaw is the always-on operations brain (chat intake, cron, delegation,
memory). Code generation is delegated to coding agents; build/ship is a deterministic
CI/EAS pipeline with no LLM in the loop; marketing runs through OpenClaw's scheduler.
**Why:** OpenClaw's strengths are gateway/scheduling/channels; it is not a coding agent
or CI system. Deterministic shipping keeps failures debuggable and credentials out of
autonomous hands.

## D2 — Template-first, agent-refined codegen (2026-08-02)

**Context:** Options were (A) local coding agents from scratch, (B) cloud coding agents,
(C) template parameterization.
**Decision:** C for the skeleton (~80%), A for app-specific logic (~20%); B is the
scale-out path in Phase 4, not the start.
**Why (founder-confirmed):** most of a small monetized app is identical boilerplate;
store review punishes half-broken novelty; reliability of shipping beats impressiveness
of generation. Where code can't be reused, principles are (D6).

## D3 — Files over chat memory (2026-08-02)

**Decision:** every stage of work produces artifacts in git (spec repos, brand packs,
decision logs). Agents are stateless against files; chat is for steering only.
**Why:** reproducibility, reviewability, and agent restarts must be cheap.

## D4 — Daily standup as the steering mechanism; Slack as founder surface (2026-08-02)

**Decision:** one daily standup (prepared by cron, posted to Slack, founder replies
in-thread) is where priorities, stage transitions, and escalations are handled.
No-reply-by-cutoff = proposal proceeds (gates still block).
**Why (founder-stated):** founder wants a daily catch-up + guide-the-day rhythm, not
per-task involvement. Slack chosen because existing patterns exist (fin-news).

## D5 — Brand identity is a swappable layer (2026-08-02)

**Decision:** each app carries a brand pack (identity, tokens, voice, feature config,
marketing strategy) that generates theming/config/copy context. Rebrand-in-place and
fork-under-new-brand are supported operations.
**Why (founder-stated):** "autonomous company with its own brand identity for each
project; ability to rebuild with different brand identities." Guardrail: forks must be
genuinely differentiated (store spam policy).

## D6 — Reuse code where possible, principles where not (2026-08-02)

**Decision:** shared template + packages for code; `03-coding-principles.md`, playbooks,
ADRs, and skills for judgment. skip-hero conventions supersede running-with-pace where
they conflict (skip-hero is the later iteration and documents why).
**Why:** the founder's two repos already demonstrate this evolution; skip-hero ADR 0005
explicitly rejects running-with-pace's alias/sync-script approach.

## D7 — Three human gates, everything else autonomous (2026-08-02)

**Decision:** founder approval required for (1) spec+brand, (2) store submission,
(3) weekly marketing calendar. Store credentials never in OpenClaw's environment.
**Why:** prompt-injection and account-ban risk concentrate at publishing; minutes of
human review guard against company-ending failures. Also keeps Apple 4.3 / Play
repetitive-content exposure under human judgment.

## D8 — The factory's own creation is the canonical process example (2026-08-02)

**Decision:** this docs-first, conversationally-refined build of the factory is recorded
(`example-run.md`) as the model for how every app must be designed: docs → rigorous
shakeout with the founder → architecture → plan → execute.
**Why (founder-stated):** "use the ensuing conversation to learn the process from me…
as a guideline/example of the process the autonomous company must go through."

## D9 — Standup at 08:00, cutoff 11:00, founder can steer anytime (2026-08-02)

**Decision:** chief of staff posts the standup at 08:00 local. Founder replies in-thread
by 11:00; no reply by cutoff = proposal proceeds (gates still block). Between and beyond
those times the founder can message at any moment for status or to change steering —
the chief of staff re-plans immediately, not at the next standup.
**Why (founder-stated):** daily rhythm with a decision window, without giving up
ad-hoc control of the ship.

## D10 — Start lean: OpenClaw Slack plugin now, dedicated Bolt service when gates need it (2026-08-02)

**Decision:** Phase 0 uses OpenClaw's Slack channel plugin (zero code, immediate).
The dedicated Bolt service (fin-news pattern) is built in Phase 3 when interactive
approval gates arrive — buttons/threads are the actual reason to go dedicated.
Interim approvals are parsed text replies ("approve spec <app>").
**Why:** don't build infrastructure before the need is real (see D11). Resolves O1.

## D11 — Org restraint: no role without a workload (2026-08-02)

**Decision:** agent profiles exist as *charters*, but a role is only instantiated when
there is work for it. Start with a minimal active set (chief of staff + product lead +
tech lead + one engineer profile); other profiles activate as the workload proves the
need. Adding a new role to the org chart requires a decision-log entry stating the
bottleneck it solves.
**Why (founder-stated):** avoid scaling too fast / bureaucracy that hinders progress.
More agents = more handoffs = more places to stall; the org chart is a menu, not a
headcount target.

## D12 — Factory runs on the founder's home machine first (2026-08-02)

**Decision:** OpenClaw + services run on the founder's local machine initially; migrate
to a VPS when always-on reliability matters (target: Phase 3, when cron-driven marketing
and standups must not miss). Resolves O3.
**Why:** cheapest iteration loop while the factory itself is under construction.

## D13 — The factory learns its process from founder sessions (2026-08-02)

**Decision:** the way the founder works in Claude sessions — how ambiguity is resolved,
how options are weighed, how scope is corrected, what gets pushed back on — is the
training source for how factory agents think and execute. `example-run.md` is the living
capture of this: each working session distills observed founder patterns into transferable
rules, and those rules feed agent profiles and playbooks. The goal is replication of the
founder's judgment, so the org becomes autonomous in *his* style, not a generic one.
**Why (founder-stated):** "learn how we talk here while we are building out app-factory…
learning from me and replicating how I do things to become autonomous."

## D14 — Workspace uses symlinks + `skills.load.allowSymlinkTargets`; never copies (2026-08-02)

**Context:** OpenClaw 2026.7 refuses to load workspace-skill symlinks whose targets
live outside the workspace unless the target root is allowlisted
(`skills.load.allowSymlinkTargets`). The README's symlink install silently produced
zero factory skills until this was set.
**Decision:** the factory workspace keeps repo files as symlinks (repo = single source
of truth) and the allowlist config is part of the install. Do not "fix" missing skills
by copying files into `~/.openclaw/workspace` — copies drift from the repo. If skills
vanish, check the allowlist first. Related: the onboard's seeded `BOOTSTRAP.md`
identity interview is deleted, not completed — the chief-of-staff persona is defined
by the repo, and pre-filled `IDENTITY.md`/`USER.md` stop OpenClaw recreating it.
**Why:** discovered during bring-up; the failure mode is silent (skills simply absent
from `openclaw skills list`), so future agents need the mechanism written down.

## D15 — Accept plaintext loopback gateway token; migrate if the bind changes (2026-08-02)

**Context:** `openclaw secrets audit` flags `gateway.auth.token` as plaintext in
`openclaw.json`. Migrating to an env SecretRef spreads the same plaintext to the
service env file plus a shell profile (local CLI resolution needs the export) —
more copies, no less exposure.
**Decision:** accept the plaintext token while the gateway is loopback-only
(127.0.0.1:18789, single-user machine, config file user-readable only).
**Upgrade trigger (recorded, founder-approved):** migrate to a SecretRef the moment
the gateway binds beyond loopback (LAN/tailnet/relayed), the machine gains other
users, or a secrets provider with keychain-backed exec resolution is configured.
Re-run `openclaw secrets audit --check` after any of those.
**Why (founder decision):** cheapest viable step; the finding guards local access on
an already-trusted boundary.

## D16 — PostHog is the factory-wide analytics provider (2026-08-02)

**Context:** O2 was open between PostHog / Amplitude / self-hosted; PostHog was the
standing lean. Founder confirmed in `#factory-standup`.
**Decision:** PostHog for all factory apps. Every app wires activation + habit +
feature events through PostHog per `playbooks/analytics-taxonomy.md`, from Phase 1 on.
**Why (founder-stated):** "posthog sounds good." Product analytics (funnels, retention,
activation/habit tracking) with a generous free tier and self-serve setup; no LLM in
the loop. Self-hostable if the portfolio outgrows the hosted tier.

## D17 — Marketing capability activated for skip-hero go-to-market (2026-08-02)

**Context:** Founder reported skip-hero's core is done and asked to start the marketing
strategy (branding, app name, content strategy + generation). The factory had no active
marketing role (dormant profiles only) per the org-restraint rule (D11: no role without a
workload).
**Decision:** Activate the dormant `marketing-lead` profile for this concrete workload
(skip-hero launch), delegated as a sub-agent producing a GTM strategy artifact in
`~/src/skip-hero/marketing/` for the founder's marketing-calendar gate. `brand-designer`
and `content-creator` stay dormant until strategy is approved and volume production is the
named next bottleneck.
**Why:** D11 satisfied — skip-hero shipping is a real workload; cheapest viable step is one
lead producing a strategy + sample content, not a standing marketing team. Escalate to
brand-designer/content-creator only on approval + a volume need.

## D18 — Orchestration layer: thin in-repo run engine, not Gas Town (2026-08-03)

**Context:** `docs/08-orchestration-layer.md` left P7 open: adopt Gas Town as the run
engine vs implement a thin molecule runner inside the factory. The vertical slice
needed: feature-dev + bug-fix workflows over running-with-pace, skip-hero, and
`apps/<name>` quickfire rigs, steerable from Slack (typed or voice), ending in a
downloadable EAS update with a QR code.
**Decision:** built `orchestration/bin/factory-run` (zero-dependency node CLI) inside
the factory instead of adopting Gas Town. Key mechanics, all verified live:
- one git **worktree per run** (`factory/<run_id>` branch) — main checkouts never
  touched; merge is a separate founder-confirmed step;
- agentic steps are **Claude Code `-p` sessions** in the worktree (repo CLAUDE.md /
  AGENTS.md standards load for free); the reviewer runs a **different model**
  (sonnet) for genuine cross-validation, writing a structured verdict JSON;
- deterministic checks/tests come from `orchestration/rigs.json` per rig —
  **production tier** (full loop) vs **quickfire tier** (template checks only);
- failure loops route findings back to the implementer (bounded by `maxLoops`);
- the engine posts progress/plan/artifacts to `#factory-builds` itself via
  `openclaw message send --target` (flag is `--target`, not `--to`) — deterministic
  delivery, no cron watcher needed;
- run state is JSON files under `orchestration/runs/` — resumable (`exec <id>`) and
  inspectable by the chief of staff.
**Why:** Gas Town is 3 weeks old, tmux-native, Beads-coupled, and its own author says
"you probably don't want to use it yet." The factory needed ~500 lines to get durable
runs with exactly our gates; revisit adoption (P7) when scale demands patrol agents
and a merge queue.

## D19 — Self-evaluation loop: SQLite telemetry + self-review workflow that ships harness improvements through the standard pipeline (2026-08-03)

**Context:** founder asked for a self-improvement loop: store structured outputs from
agent nodes (commits, links, verdicts — not context dumps), review how runs actually
went, and let the factory improve its own harness after founder confirmation in Slack.
**Decision:**
- run telemetry in `orchestration/telemetry.db` (`node:sqlite`, zero deps): runs,
  per-attempt step outcomes/durations, artifacts (commits, review verdicts/findings,
  deploy URLs). `factory-run report` is the query surface; it backfills pre-telemetry
  runs from run dirs.
- `self-review` workflow: analyze node (reads report + run dirs + harness source,
  writes a ONE-improvement plan) → Slack plan gate (founder discussion via chief of
  staff) → **spawn** step that launches a full feature-dev graph execution on the new
  `app-factory` rig with the approved plan as the feature request.
- `app-factory` rig deploys via **harness-merge**: validated branch merges to main +
  gateway restart = improvement live. Spawned child runs are auto-gated (plan already
  founder-approved); checks + cross-model review still apply. Rollback = revert the
  merge commit.
- cadence: weekly cron (Sun 17:00) + on-demand `factory-self-review` skill.
**Why:** the loop reuses the exact pipeline that builds apps — same worktrees, same
validation, same Slack gates — so harness changes get the same rigor as product
changes, and every self-improvement is itself telemetry for the next review.

| ID | Question | Leaning | Needed by |
|---|---|---|---|
| ~~O1~~ | ~~Slack surface~~ | Resolved → D10 (plugin now, Bolt service at Phase 3) | — |
| ~~O2~~ | ~~Analytics provider~~ | Resolved → D16 (PostHog, factory-wide) | — |
| ~~O3~~ | ~~Where the factory runs~~ | Resolved → D12 (home machine, VPS at Phase 3) | — |
| O4 | Coding agent runtime (local Claude Code sessions vs Agent SDK service vs cloud Managed Agents) | Local sessions first; revisit Phase 4 | Phase 2 |
| O5 | Separate Apple/Google developer accounts per niche vs one account | One account until portfolio proves out | Phase 3 |
| O6 | Whether marketing content generation uses multiple model providers | Decide when marketing engine is built | Phase 3 |

## D20 — Model + reasoning-effort policy: Opus 5 default, tiered effort (2026-08-03)

**Context:** Factory harness was running Opus 4.8 against the Claude Max 5x subscription (not API pricing). Founder directed an upgrade and set standing effort tiers.
**Decision:** Default model → **Opus 5** (`claude-opus-5`). Global `thinkingDefault` → **medium**. Reasoning tiers for dispatch: **medium** = standard tasks (default); **high / xhigh** = higher-reasoning tasks; **Fable 5** (`claude-fable-5`) at **high** effort = large feature requests. Runtime stays Claude CLI on the Max subscription (flat cost, rate-limited).
**Why:** (founder-stated) Better default capability with cost-controlled subscription billing; reserve expensive reasoning for tasks that need it and route large features to Fable 5. Dispatch (factory-dispatch / factory-feature) must select model+effort per task per these tiers rather than always using the global default.

## D21 — Founder corrections are captured in the decision log; self-review reads it (2026-08-04)

**Context:** Founder asked whether the self-review loop learns from Slack conversations
and the corrections he has had to make. It does not — evidence was telemetry, run dirs,
and harness source only; chat is not retained anywhere. The highest-signal data in the
factory (what the founder had to correct) was evaporating.
**Decision:** Corrections and stated preferences get written down as they happen —
consequential choices to `docs/process/decision-log.md` (D-entries), working-style
observations to "Observed founder patterns" in `docs/process/example-run.md` — and the
self-reviewer prompt now reads both as a first-class evidence source. A correction the
founder had to make more than once is treated as a harness defect, and the review must
name the prompt or workflow file that should have encoded it.
**Why (founder-stated):** the self-review loop should improve the orchestration layer
from founder conversations, not just run telemetry. Chose the discipline+prompt version
over a structured `corrections.jsonl` capture pipeline as the cheapest viable step;
upgrade trigger is evidence that corrections are being forgotten rather than recorded.

## D22 — Per-step context capture: full transcripts + `factory-run context`; D19's "not context dumps" clause superseded (2026-08-04)

**Context:** the factory recorded only each agent step's rendered prompt and a ~1.6 kB
result envelope; the step's real working context (6–9M cached tokens per implement
step) and the founder↔OpenClaw conversations that start runs were invisible to the
self-review loop, which had to infer failure causes from wreckage. D21's upgrade
trigger — evidence that founder context was being lost rather than recorded — fired.
**Decision:**
- agent steps run `claude --output-format stream-json --verbose` with stdout streamed
  to `<step>[.N].transcript.jsonl` in the run dir via a file descriptor (MB-scale
  transcripts survive timeouts/kills). The prior single-object envelope is
  reconstructed from the transcript's `"type":"result"` event, so `parseUsage`, the
  report backfill, and the web console are untouched; on timeout/kill, usage falls
  back to the last assistant event's `message.usage` so failed attempts stop costing
  "null".
- `factory-run context <run_id> [--json]` reports per step/attempt prompt bytes,
  steering/findings injections, tokens by category, cost, duration, assistant turns,
  tool_use counts, and models — deterministic parsing only; LLM-side inference stays
  in the self-reviewer prompt. `factory-run context --sessions` inventories OpenClaw
  session transcripts (discoverable, not ingested); the self-reviewer samples both.
- report backfill became attempt-aware (`implement.2.output.json` → step `implement`
  attempt 2, `AND attempt = ?` in the UPDATE), fixing the every-row double-count and
  the `implement.2` step-name mis-parse.
This supersedes the "not context dumps" clause of D19: telemetry stays structured,
but full per-step context is now captured on disk as evidence.
**Why:** the self-review loop can only fix what it can see; context/cost analysis
must start from true numbers. Run dirs grow by MBs per step — acceptable, reclaimed
by existing cleanup; rollback is a `git revert` of the merge commit.

## D23 — New-app intake becomes a native orchestration workflow (2026-08-05)

**Context:** `orchestration/workflows/new-app.json` was two `manual` steps: the
orchestrator drove the `factory-new-app` skill via OpenClaw sub-agent sessions, so
the phase with the highest cost of a wrong assumption (spec, audience, kill decision)
was the only one with no run dir, no telemetry, and no reviewable diff. Feature and
bug work on the resulting `factory:<name>` quickfire rig already ran on the engine —
zero such runs exist to date, so the path is wired but unexercised.
**Decision:**
- New-app intake (refine → market-check → spec gate → brand → stamp template → spawn
  first feature-dev run) becomes a real engine graph. It runs on the `app-factory`
  rig: `apps/<name>/` lives inside that repo, so the existing worktree machinery
  applies unchanged and the spec gate reviews a branch diff rather than a Slack paste.
- Sequenced as two runs. Run 1 (`feature-per-step-agent-profile`) adds an optional
  `agent` field to agent steps, composing the rendered prompt from `agents/<profile>.md`
  verbatim plus the task prompt template, with preflight validation of a missing
  profile. Run 2 ports new-app onto the engine and must not start until run 1 merges.
- The market-check verdict is a **hard** gate, delivered immediately rather than
  batched into the 08:00 standup, and it is *conversational*: founder↔agent turns
  continue until no questions remain, resolving to go-ahead or don't-build. Today's
  `gate` step cannot do this — it posts once and blocks on a single approve/reject
  decision file with a 12h timeout, and reject loops the run back a step rather than
  reopening the thread. A generic interactive `discussion` step type is therefore
  folded into run 2 (founder-stated), proving itself on new-app before other
  judgement-call gates adopt it.
- Standup stops hand-maintaining pending gates: `factory-standup` currently greps an
  "Awaiting founder" section of STATE.md, which is only as true as its last editor.
  Once intake is a run, standup builds its agenda from engine state and STATE.md
  becomes a rendered view. Intake gate timeouts should be shorter than the current 12h
  so a missed standup does not silently burn a day.
**Why:** the self-review loop can only tune what it can measure, and idea intake was
invisible to it (founder-stated: "that gets us telemetry for free... we can tune the
new app generation process better"). A hard conversational gate is what makes an early
kill cheap — a don't-build verdict should stop burning agent time the moment it lands,
and single-shot approve/reject cannot reach a decision on a question the founder has
not finished asking. Sequencing prevents run 2 planning against an engine without
`step.agent`.

## D24 — feature-dev's plan gate becomes a `discussion` step (2026-08-05)

**Context:** D23 built the generic `discussion` step type and proved it on new-app's
spec discussion, explicitly deferring adoption by "other judgement-call gates" until
it had run in anger. The founder asked for feature-dev next. The plan gate had the
same defect the spec gate did: it posts the plan once and blocks on a single
approve/reject decision file, so "yes, but drop the offline case" had nowhere to go
except `reject`, which kills the run and throws the plan away.
**Decision:**
- `feature-dev.json` step `plan-gate` (type `gate`) is replaced by `plan-discussion`
  (type `discussion`, prompt `plan-discussion`, 8 turns, 240-minute idle timeout).
  The founder can now iterate on the plan; each turn rewrites `plan.md` on disk so
  the implementer reads the agreed plan, not the original one.
- `approve` starts implementation, `reject` drops the feature (run state `killed`),
  `reply` continues the conversation. Turn cap and idle timeout fail loudly and
  never auto-approve, as with new-app.
- The discussion step now honors `skipWhen: "auto"` per step. feature-dev sets it,
  so `--auto` runs (founder "just do it", and the spawned children of new-app and
  self-review, whose plans are already approved) skip the conversation exactly as
  they skipped the gate. new-app's spec discussion deliberately does not set it: it
  is the don't-build kill switch and must never be skippable.
- `self-review.json` keeps its one-shot `gate` — its output is a single improvement
  plan the founder approves or doesn't, and the resulting child run has its own
  plan discussion anyway.
**Why:** the plan is the cheapest place to change a feature's mind, and the gate
made that the one place a conversation could not happen. Reusing the step type
rather than special-casing feature-dev keeps one implementation of the founder
conversation — bounds, telemetry, resume, and web console all came free.

## D25 — Standup reads run/gate status from the engine; STATE.md stays hand-written narrative (2026-08-05)

**Context:** the daily standup learned about pending gates and in-flight runs by
grepping STATE.md's hand-written "Awaiting founder" section, so it reported whatever
a human last wrote there — approved-hours-ago gates, or nothing for a genuinely
blocked run. Meanwhile `factory-run` already knows every run's state, step, gate,
and cost.
**Decision:** the standup sources run/gate/cost facts from the engine —
`factory-run status --json` (now enriched with a machine-readable `currentStep`
and, for awaiting-approval runs, a `gate` object distinguishing a plan gate from a
discussion awaiting a founder reply) plus `report --json` / the telemetry db for
aggregates — never by parsing human-formatted output or STATE.md. A discussion
awaiting a founder reply counts as a pending gate; a run ending `killed` is a
completed success (early kill = money saved), never a failure. STATE.md stays a
committed, hand-written narrative (phase, active apps, yesterday/today plans) —
no codegen, no auto-writing — and loses only the run/gate-status duty.
**Why (founder-stated, 2026-08-05):** the founder's 30-second morning read must be
trustworthy without changing its format or the 08:00 post / 11:00 reply-cutoff
ritual; hand-maintained state had already drifted from engine truth. The
factory-status skill shares the same disease (its step 1 reads STATE.md and even
instructs fixing it when stale) — flagged, deliberately untouched here as a
separate founder decision.

## D26 — Per-rig merge/deploy policy, awaiting-merge, and agent-decided preview mode (2026-08-05)

**Context:** whether a run's branch merged was an accident of its rig's deploy
mechanism: harness-merge rigs (app-factory) merged during deploy, eas-update rigs
(skip-hero, running-with-pace) never merged and never said so — 1.9 GB of skip-hero
worktrees stranded silently as `done` runs whose branches nobody knew to merge.
There was also no way for the founder to try an app build before it shipped.
**Decision:**
- Every rig gets an explicit, validated `policy` object beside `deploy`:
  `{"merge": "auto"|"review", "deploy": "auto"|"hold", "preview": "on"|"off"}`.
  Policy is the whether/when; `deploy.type` stays the mechanism (how). Unknown
  keys/values fail the run at preflight, naming the rig and key, before any
  worktree or agent step.
- **Safe defaults:** absent `merge` → `"review"` (never auto-merge by surprise),
  absent `deploy` → `"auto"` (publishing a preview update is additive and was
  already every rig's behaviour), absent `preview` → `"off"`. skip-hero and
  app-factory are configured `{"merge": "auto", "deploy": "auto"}` (founder
  decision 2026-08-05); running-with-pace and quickfire apps keep the defaults.
- Merging is a first-class action shared by every deploy type (`mergeRunBranch`,
  extracted from harness-merge, including the base-drift `classifyRecovery`
  rebase/reverify/resolve loop). Order: merge first, publish second — the
  published bundle equals what landed on the default branch.
- **The engine never pushes the rig's default branch:** auto-merge is local-only
  for every rig. The engine's only push is the run's own `factory/<id>` branch
  (`git push --force-with-lease -u origin factory/<id>`, so console commit links
  resolve and agents' plain `git push` has an upstream); a selftest pins that
  every push command in the engine targets `factory/<id>` and never the base
  branch. A future `policy.push` can opt in to pushing the merged default branch.
- Merge-policy "review" runs end in the new terminal state **`awaiting-merge`**
  (not `done`): a completed success holding a founder action. Slack, the console,
  the standup, and `status --json` (machine-readable `pendingMerge: {branch}`)
  all name the branch; cleanup skips it while unmerged and reclaims worktree +
  branch after the manual merge.
- `deploy: "hold"` ends the run `done` with `deployHeld: true`; the publish is
  released on demand (`factory-run deploy <id>` / console button).
- **feature-dev preview mode** (per-run flag over per-rig `policy.preview`,
  default off): before merge+deploy, a `release-decision` agent step — profile
  `agents/release-engineer.md`, a narrow classification charter — reads the
  branch diff and rules `build` (anything needing a new native binary: deps,
  app.json/app.config/eas.json/plugins, ios/android dirs, expo-* SDK or
  runtimeVersion) vs `update` (JS/TS/asset-only → free ~90s `eas update`). The
  verdict, not a default, spends paid build minutes. Kind + reasoning + decisive
  evidence are stored in run.json, telemetry, and rendered in the console beside
  the artifact. **Fail-safe: agent error, timeout, or ambiguity resolves to
  `build`** — the direction that cannot silently ship a native change as an OTA
  update that never reaches a device — flagged `failSafe: true` and named in the
  Slack notification. The preview gate reuses the `gate` step type with
  `autoApprove: false`: `--auto` skips the plan discussion, never the
  try-it-first gate.
- **Deploy retries and recoveries never repeat the merge or the preview.** A
  landed merge is recorded (`run.mergedSha`) and skipped on any resumed deploy —
  re-checking drift after the merge commit lands would misread the advanced base
  as drift and burn recovery cycles on retries of an unrelated publish failure.
  Likewise a passed preview gate is recorded (`run.previewApproved`), so a
  genuine base-drift recovery looping back through `checks` re-runs the
  deterministic gates but never release-decision/preview/preview-gate — no
  second paid build, no second approval request. Both decisions are pure
  functions (`classifyDeployMerge`, `classifyPreviewStep`) pinned by selftest.
**Why:** merge behaviour must be a stated policy, not an artifact of the deploy
mechanism — the safety asymmetry is that merging is irreversible and touches the
default branch, while publishing a preview is additive. The preview mechanism is
agent-decided (founder decision 2026-08-05, superseding a hard-coded heuristic)
because the build-vs-update call depends on what actually changed, and a wrong
call must be diagnosable from recorded reasoning rather than buried in a
heuristic's silence.

## D27 — skip-hero is the priority app; pullup is backlogged (2026-08-06)

**Context:** pullup had been app #1 since 2026-08-02 (BUILD-WITH-CHANGES verdict,
on-device Vision spike VALIDATED) but has sat ON HOLD at its spec gate since
2026-08-03 09:20, while skip-hero was only ever a rig used for harness smoke runs
(`feature-msdn5cuj` done, `feature-msdpir37` failed since 2026-08-03). Three days
of factory-improving-the-factory with zero product movement on either.
**Decision:** skip-hero becomes the priority app and takes all product capacity.
pullup is sidelined to the backlog entirely — not killed, not un-paused; its spec
gate is withdrawn rather than pending, and `apps/pullup/` artifacts (spec.md,
market-notes.md, spike results) are preserved untouched for a possible later
restart. Do not schedule pullup work, re-open its spec gate, or list it as an
awaiting-founder item until the founder explicitly reverses this. The stale
`feature-msdpir37` skip-hero run is now on the priority app and should be
resolved or killed rather than left failed.
**Why (founder-stated, 2026-08-06):** "skiphero is now the priority. We can
sideline/backlog the pullup app entirely." Supersedes the pullup-as-app-#1
direction from 2026-08-02 and removes the recurring "un-pause pullup" standup
recommendation.

## D28 — Camera counting is not the wedge; footwork verification is (2026-08-07)

**Context:** the 08-06 skip-hero marketing strategy read camera-based rep counting
as "table stakes, not the wedge," because every competitor ships it. The research
commissioned by the founder on 08-07 (`docs/marketing/apps/skip-hero.md`, `da3a46b`)
pulled the store numbers: all five camera-based jump-rope counters hold **44 US
ratings between them** across three and a half years, while hardware-tethered
Crossrope — £199 rope plus $4.99/mo — holds **13,476**. Competitors shipping a
feature nobody downloads is evidence about demand, not saturation.
**Decision:** stop positioning skip-hero on counting. The defensible wedge is
**footwork verification** ("it can tell which foot you landed on"), gated on F1 —
surfacing the landing readout on the live session and summary screens, since it
exists today only on the Debug screen. F1 started as
`feature-f1-surface-footwork-readout`. Run **tile rush as a rhythm game** as a
distribution experiment only (filmable today, zero product work, worst-monetising
cohort — it tests whether we can get reach at all, it is not positioning). Let the
**"no £199 rope"** Crossrope-intercept query set compound on YouTube in the
background; it is the only audience in this space proven to spend money.
Standing copy constraint: the app must never claim to name a move — there is no
move classifier, and marketing recognition invites a review-driven expectation gap.
**Why:** the previous read inverted the evidence, and the content plan built on it
was unbuildable — its designated hero clip shows the app naming what the user's feet
did, which no user-facing screen does. Every calendar in that set also assumed a
store launch against a repo at 0.1.0 with no listing, no paywall and no IAP.

## D29 — Review-policy runs end at a PR; `sync` is the only exit from awaiting-merge (2026-08-09)

**Context:** green runs on rigs without `policy.merge: "auto"` pushed
`factory/<id>` and parked forever in `awaiting-merge` — no PR to review or
discuss, and the run never turned green after the founder merged. D26 already
pinned that the engine never pushes a rig's default branch.
**Decision:** the deploy step's review path opens (or idempotently reuses) a
GitHub PR from the run's branch into the rig default branch via `gh`
(`gh pr create` pushes nothing, so D26 stands; a non-GitHub origin or missing
`gh` degrades to a recorded `run.prWarning`, never a failed run).
`factory-run sync <id>` is the single sanctioned exit from the still-terminal
`awaiting-merge` state: a merged PR flips the run to `done` (recording
`mergedSha` from the merge commit); a PR closed without merging flips it to the
new terminal `closed` state — worktree torn down, branch kept alive in git
(founder steering, 2026-08-09) so the chain is restartable. Follow-up runs
(`factory-run followup`, or the run page's composer) chain feature-dev/bug-fix
runs onto a green terminal parent (`awaiting-merge`, `done`, or `closed` —
post-merge follow-ups allowed per founder steering: the PR gives good reference
context), continuing the parent's branch and worktree so one PR accumulates the
whole conversation; they run non-auto, so the child's plan discussion *is* the
PR conversation. Cleanup refuses to reclaim a branch or worktree shared with a
live chain member.
**Why:** merging is a founder judgment and GitHub is where that judgment
happens — the engine's job ends at an open, reviewable PR, and re-entering the
run lifecycle must go through one auditable verb rather than loosened terminal
states. Keeping the branch when a PR closes preserves the option value of the
work at near-zero cost (a worktree is GBs; a branch is a ref).

## D30 — Immutability by default; mutation needs a named optimisation (2026-08-10)

**Context:** a bug fix on `running-with-pace` (PR #45) copied the open segment's
`line_path` per live-run snapshot. The founder challenged it as per-event allocation in
a core library, added to patch around a React Native prop-diff detail the library knows
nothing about, and proposed mutate-in-place plus a change-notification hook instead.
Evidence contradicted the premise: the same function already `flatMap`s the whole run's
points on every fix, so the copy was the cheapest allocation there, and the RN adapter
needs a fresh array regardless — the hook would have added a second mechanism without
removing the first.
**Decision:** across the factory, immutability is the default. Mutation is permitted only
for a specific, named optimisation, and must be limited in scope and abstracted so
shared-mutable-state hazards do not leak to callers (founder-stated). Where mutation
survives, document the reason at the mutation site in terms of the value contract, not in
terms of whichever downstream consumer happened to break. Concretely on pace:
`LiveRunSmoothingLayer.buildRun()` returns a snapshot that behaves as a value — the open
segment's path is copied; closed segments are deliberately shared, because their stable
identity is what stops settled sections being re-sent to the native map on every fix.
**Why:** a mutable value handed across a boundary makes every consumer responsible for
knowing when it changed, which is a bug class the codebase then owns permanently.
Copying is normally cheap next to the work already being done, so the exceptions must be
deliberate and stated rather than incidental. Rationale written against a specific
consumer rots and invites a future agent to "clean up" a load-bearing copy.

## D31 — policy.merge "auto" removed: every rig is PR-gated; cleanup's merge truth is gh (2026-08-11)

**Context:** the founder found app-factory's local `main` sitting 2 commits
ahead of `origin/main` for six days. Root cause: `policy.merge: "auto"` (D26)
merged the run branch into the rig's **local** default branch, and — by D26's
own never-push-the-default-branch invariant — nothing ever pushed it. Every
downstream surface (state `done`, the completion notify, end-of-run cleanup)
treated the run as finished, so the divergence was silent. The only rig on
auto was app-factory itself: the rig that rewrites the harness was the one
place review was skipped. Two co-located defects made the PR flow worse:
`classifySync` hard-refused awaiting-merge runs with no recorded PR (legacy
runs were stuck forever, sync being their only exit), and `cleanupRun` decided
"merged" from local branch ancestry — structurally always false for
squash-merged PRs, which is why cleanups kept needing `--discard`.
**Decision (supersedes D26's merge half; its deploy/preview halves and the
push invariant stand):**
- `policy.merge` has exactly one value, `"review"`. The key survives so a
  stale `"merge": "auto"` fails preflight/exec loudly, naming the rig and key
  and explaining the removal. Auto-merge's whole execution path is deleted:
  `mergeRunBranch`, the base-drift recovery loop (`classifyRecovery`, the
  synthetic `resolve-conflicts` step, `conflict-resolver.md`), the deploy-step
  merge phase, and the retry classifier's recovery-cap tier. A run branch is
  now either PR-merged-and-synced or still open — no third state.
- app-factory's deploy retypes `harness-merge` → `harness-restart`: the deploy
  step ends at an open PR like every rig, and the gateway/web-console restart
  moves to `factory-run sync`'s done path, gated on the rig checkout
  containing the merge commit after a `git fetch origin` (degrade to an
  actionable "pull, then restart manually" — never push, never pull).
- Cleanup's merge truth is gh (extending D29): a run with a recorded PR is
  reclaimable when GitHub says the PR merged (fetch first; `git branch -D` is
  correct and required for squash merges — the branch is provably merged on
  origin); runs without a PR keep the conservative local ancestor check and
  `-d`. `classifySync` degrades PR-less legacy runs to an actionable
  "unsyncable" message, and `factory-run sync --all` sweeps every
  awaiting-merge run without aborting on one failure.
- The founder rejected the `policy.push` alternative (engine pushing the
  merged default branch): the engine's only push stays `factory/<id>`, and the
  selftest push-source scan continues to pin exactly that.
**Why:** a merge that exists only on one machine is a lie the moment any
surface reports it as shipped. Review-gating the harness rig gives its changes
the same rigor as product changes (reversing D19's auto-merge convenience),
and making GitHub the single source of merge truth removes the class of
"engine thinks X, origin knows Y" bugs instead of patching each one.
