# Agent Harness — System Design (v0 draft for approval)

> Internal dev tooling / personal project. Codename `harness`.
> Owned by the founder; drafted by chief-of-staff 2026-08-02 for the design gate.
> This doc is the artifact the harness itself would produce: a design-first sketch
> to explore → edit → approve **before** any workers build.

## 1. Goal

An agentic IDE harness the founder can drive from a phone (Expo app) or laptop, that
runs **multi-agent workflows on any repo**, never forgets, and — crucially — puts
**validation "heads"** over the workers so they don't make false assumptions or stray.
Every new app/feature starts as a **design interview → system-design artifacts
(md + svg) → approve**, and only then do workers build. It can spawn iOS simulators and
drive them over MCP for visual testing.

## 2. The one decision this doc settles: compose, don't green-field

Your idea is ~80% what OpenClaw + this App Factory already are, generalised to any repo.
So the design is **thin custom layers on a substrate we already run**, not a new harness.

| Layer | Build or reuse | Notes |
|---|---|---|
| Providers / agent loop | **reuse** | `pi-ai` (multi-provider), `pi-agent-core` (loop, tools, state). pi is the stack under OpenClaw already. |
| Channels, cron, sessions, memory, mobile node, worktree isolation | **reuse** | OpenClaw gives these for free. |
| Multi-agent orchestration (DAG / fan-out) | **reuse + thin** | OpenClaw Workflow primitive (phases, pipeline, parallel) + subagents. |
| **Validation heads (supervision)** | **ADOPT — `pi-hydra`** | Already built (see §4). We only *author heads* (markdown): assumption + drift-vs-approved-design; reuse hydra's stock quality/security. |
| Multi-worker orchestration | **reuse + thin** | pi-subagents / pi-orchestration or OpenClaw workflows. Heads and subagents *stack*. |
| **Design-first gate** (interview → md/svg → approve → brief) | **build** | Generalises the factory spec gate; adds diagram generation. The novel-core work now lives here. |
| iOS simulator + visual test | **build — add-on** | MCP over `xcrun simctl` + screenshot→vision. |
| Clients: laptop CLI/TUI + Expo mobile | **build — thin** | Both talk to the gateway; mobile rides the OpenClaw node. |

### Compose-on-OpenClaw/pi vs fork pi-mono
- **Compose (recommended):** fastest; reuse gateway/channels/cron/memory/mobile/worktrees.
  You own only orchestration + heads + gate + sim-MCP + Expo. Con: coupled to OpenClaw's
  abstractions.
- **Fork pi-mono:** maximum control of the loop/context (pi's whole thesis is *you* own
  the context window), cleaner library base — but you rebuild channels/cron/memory/mobile
  that OpenClaw already gives. More surface to maintain = bloat.
- Since pi is already the substrate under OpenClaw, **drop to `pi-agent-core` directly
  only for the worker/head loop** if you need tighter context control. **Upgrade trigger
  to a full fork:** OpenClaw's workflow/subagent model can't express the head-veto +
  iterative-refine loop we need (§4).

## 3. Architecture (see architecture.svg)

```
Clients (Expo mobile / laptop CLI-TUI)
        │  approve designs · kick off · watch heads
        ▼
OpenClaw Gateway  ── memory · cron · sessions · worktrees ──┐
        │                                                   │
Design-First Gate ── interview → design.md + *.svg → APPROVE ┘  (= ground truth)
        │ approved brief
        ▼
Orchestrator ──spawns──► Workers (per-repo worktrees)
                              │  proposed change / plan / diff
                              ▼
                         Validation Heads  ◄── ground truth (approved design, repo, tests)
                         (assumption · drift · verify · visual)
                              │ pass → merge + update memory
                              │ veto → back to worker with the specific violation
                              ▼
                         iOS Simulator (MCP: simctl + screenshot→vision)
Substrate: pi (pi-ai, pi-agent-core) + OpenClaw
```

## 4. Validation heads — adopt `pi-hydra` (not built)

`pandysp/pi-hydra` already implements this: **live oversight** of a pi driver session by
observer *heads*, each a single markdown file. A head sees exactly what the agent sees at
the agent's own prompt-cache commit points and returns one of five decisions —
**noop / print / queue / steer / interrupt** — and may also act via the agent's tools.
It's cheap because each observation replays the driver's byte-identical payload as a
*cache read* (~30% added per always-on head), not a context rebuild. So the "catch a bad
assumption mid-run for the price of one correction, not a refactor" property is built in.

Our work is therefore just to **author heads** tuned to the factory, run *beside* each
worker step, prompted to **refute**:

- **Assumption Head** — extracts the worker's stated + implicit assumptions and checks
  each against ground truth (approved design, repo, tests, docs). Blocks on any
  unverified assumption. (Directly targets "not making false assumptions.")
- **Drift / Scope Head** — diffs the worker's plan/output against the **approved
  design**. Flags scope creep and divergence. (Targets "not straying.") The approved
  design existing as a committed artifact is what makes this checkable.
- **Verify Head** — adversarial correctness: does it build, do tests pass, does it meet
  the acceptance criteria from the design.
- **Visual-Test Head** — for UI: drives the simulator, screenshots, asserts screens
  against the approved mocks/design.

Consensus: default is **one head per check with veto power**; escalate to a small
**refute-panel majority** only where false positives are costly. Pattern mirrors the
adversarial-verify approach (spawn skeptics, default to "refuted" when uncertain).

## 5. Never-forget (memory model)

Files-over-chat (factory D3). Per-repo `.harness/` committed to git: design docs,
decision log, acceptance criteria, and a knowledge index. OpenClaw memory holds
cross-repo/user context. Heads and workers read from these; every merged step writes back.

## 6. Phasing — cheapest viable step, each gated

- **Phase 0 (spike, days):** worker + **one** head (Assumption *or* Drift) on **one**
  repo via OpenClaw Workflow. Success = the head catches a *planted* false assumption /
  scope drift. No mobile, no sim.
- **Phase 1:** Design-First Gate producing md + svg + approval, feeding the worker brief.
- **Phase 2:** iOS-simulator MCP + Visual-Test Head.
- **Phase 3:** Expo mobile client (review / approve / kick off / watch heads).
- Stop at "useful enough." This is internal tooling competing with app-shipping time —
  scope it as a thin layer, not a platform, until a named bottleneck justifies more.

## 7. Open decisions (defaults on the table)

1. **Loop substrate:** OpenClaw Workflow vs raw `pi-agent-core` for the worker/head loop.
   *Default: OpenClaw Workflow first; drop to pi-agent-core only if the veto loop needs it.*
2. **Head consensus:** single veto head vs multi-head majority. *Default: single veto per
   check; add voting only where false positives hurt.*
3. **Phase-0 dogfood repo:** which repo do we prove it on? *Default: `app-factory` itself
   (or the pullup app once its spec lands).*
4. **Simulator MCP:** adopt an existing iOS-simulator MCP vs build a thin one.
   *Default: adopt if a healthy one exists, else ~1-file simctl wrapper.*

## 8. Reasons this could be a mistake (honest)

- It's a platform, and platforms eat the roadmap. The factory's job is shipping apps;
  this competes for the same operator (me) and your time.
- Much of it already exists in OpenClaw — the marginal value is *only* the heads + the
  design gate. If those two don't measurably reduce rework, don't build the rest.
- Mitigation: Phase 0 is a few days and proves the single riskiest claim (heads catch
  drift). Kill or continue on that evidence.

---

## Gate record
- Design approved by founder: _pending — this doc + architecture.svg_
