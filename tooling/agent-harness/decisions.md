# Decision Log — agent-harness (internal tooling)

Append-only; record the why. Promote to an ADR anything a future agent might undo.

---

## H1 — Greenlit as internal tooling; design-first before any build (2026-08-02)

**Context:** Founder floated an agentic IDE harness (mobile Expo + laptop, multi-agent
workflows, validation "heads", any-repo, never-forget, design-first, iOS-sim visual
testing). Asked to be taught pi-mono / Hermes and chose Option 1 (produce the
system-design doc, with validation heads as the centerpiece) over jumping to a spike.
**Decision:** Treat as internal dev tooling (personal project), not a factory app.
Deliverable first = `design.md` + `architecture.svg` for the founder design gate. No
worker build until the design is approved.
**Why (founder-stated):** "Yes let's do this with the validation heads. Option1." Matches
the factory's design-before-code ethos (spec gate, D3 files-over-chat).

## H2 — Compose on OpenClaw + pi; do not green-field the harness (2026-08-02, proposed)

**Context:** pi (badlogic/pi-mono) is the composable agent toolkit (`pi-ai`,
`pi-agent-core`, web UI, Slack bot, pods) and is the stack under OpenClaw; Hermes is a
fuller, more opinionated persistent-assistant agent. The founder's idea is ~80% what
OpenClaw + the App Factory already provide.
**Decision (proposed, pending gate):** Reuse OpenClaw (channels/cron/sessions/memory/
mobile/worktrees) + pi (`pi-ai`, `pi-agent-core`). Build only the two distinctive layers:
(1) validation heads (assumption / drift-scope / verify / visual), (2) the design-first
gate. iOS-simulator MCP + Expo client are thin add-ons in later phases.
**Why:** cheapest viable step; avoids rebuilding what we already run (bloat guard).
**Upgrade trigger to fork pi-mono:** OpenClaw's workflow/subagent model can't express the
head-veto + iterative-refine loop. Re-evaluate then.

## H3 — Adopt pi-hydra for the validation-heads layer (2026-08-02, founder-sourced)

**Context:** Founder pointed to `pandysp/pi-hydra`. It is a mature pi extension that
already implements exactly the "heads" concept H2 planned to build: live oversight of a
pi driver session by observer heads, each a single markdown file, that see what the
agent sees at its own prompt-cache commit points and return one of five decisions —
noop / print / queue / steer / interrupt. Heads can also act via the agent's tools.
Cost is a cache read per observation (~30% added per always-on head), because it replays
the driver's byte-identical payload as a cache hit rather than rebuilding context.
**Decision:** Do NOT build a heads engine. **Adopt pi-hydra**; our work becomes
*authoring heads* (markdown) — an Assumption head and a Drift/Scope head that check
against the approved design — plus reusing hydra's stock quality/security heads.
**Why (founder-stated):** "Check out the pi-hydra repo. I think we can use this." It
collapses the one piece I'd marked novel-core into configuration.
**Boundary / caveat:** hydra is *live oversight of one driver*, model-locked to the
driver (Anthropic — fine for us), and is NOT multi-worker orchestration, a design gate,
a simulator, or a mobile app. Those remain: orchestration = pi-subagents/pi-orchestration
or OpenClaw workflows; design gate, iOS-sim MCP + visual head, and the Expo client are
still ours to build. Heads and subagents *stack* (heads steer from above; the driver
spawns subagents below).
