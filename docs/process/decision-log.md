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
