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

---

## Open decisions

| ID | Question | Leaning | Needed by |
|---|---|---|---|
| ~~O1~~ | ~~Slack surface~~ | Resolved → D10 (plugin now, Bolt service at Phase 3) | — |
| O2 | Analytics provider (PostHog / Amplitude / self-hosted) | PostHog (self-hostable, generous free tier) | Phase 1 |
| ~~O3~~ | ~~Where the factory runs~~ | Resolved → D12 (home machine, VPS at Phase 3) | — |
| O4 | Coding agent runtime (local Claude Code sessions vs Agent SDK service vs cloud Managed Agents) | Local sessions first; revisit Phase 4 | Phase 2 |
| O5 | Separate Apple/Google developer accounts per niche vs one account | One account until portfolio proves out | Phase 3 |
| O6 | Whether marketing content generation uses multiple model providers | Decide when marketing engine is built | Phase 3 |
