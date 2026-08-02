# Example Run — How the Factory Itself Was Designed

> This is a living record of the factory's own design process, kept as the canonical
> example of how the autonomous company designs anything. When an agent asks "how much
> rigor does stage N need?", the answer is: this much.
>
> **This document is also training data (D13).** The founder's working sessions are the
> source the org learns from: how he resolves ambiguity, weighs options, corrects scope,
> and paces investment. Each session ends with newly-observed founder patterns distilled
> into the rules below; those rules feed agent profiles and playbooks. The goal is that
> the org becomes autonomous *in the founder's style* — replicating how he does things,
> not a generic process.

## The pattern being demonstrated

```
vague idea → clarify intent → ground in reality → propose options with a recommendation
→ founder decides → write it down → refine through dialogue → plan → execute → retro
```

## What actually happened (session 1, 2026-08-02)

1. **Spark.** Founder: "a fully autonomous application factory — code, pipelines,
   tooling, and marketing — using OpenClaw."
2. **Clarify before designing.** The agent did not start building. It first resolved two
   ambiguities: what "OpenCore" referred to (→ OpenClaw) and what the goal was
   (→ revenue portfolio). *Lesson: a wrong assumption here invalidates everything after.*
3. **Ground in reality.** Researched OpenClaw's actual capabilities (gateway, cron,
   channels, skills) instead of designing against an imagined tool.
   *Lesson: check what the tool actually does today.*
4. **Options with a recommendation.** Codegen was presented as three options (from-scratch
   agents / cloud agents / template-first) with tradeoffs and a clear recommendation —
   not a menu without an opinion, not a single take-it-or-leave-it design.
5. **Founder decided; scope sharpened.** Founder chose template-first and added the real
   shape of the vision: an autonomous *company* — agent roles, brand identity per project,
   rebuildability, daily standup, Slack. *Lesson: the founder's reply is the highest-value
   input in the process; design for it, don't route around it.*
6. **Ground in the founder's own practice.** Before writing principles, the agent studied
   the founder's repos (running-with-pace, skip-hero, fin-news) and derived conventions
   from what they actually do — noting where the repos disagree and which generation wins.
   *Lesson: principles extracted beat principles invented.* Also surfaced a factual
   discrepancy immediately (claude-van-damn doesn't exist; fin-news holds the Slack
   pattern) rather than silently guessing.
7. **Write it down.** Foundation docs written as reviewable artifacts; every decision of
   consequence logged with rationale (D1–D8); open questions listed with leanings (O1–O6).
8. **Next: rigorous shakeout.** The docs are a draft to be challenged in conversation —
   the equivalent of stages 1–5 for an app — before implementation begins.

## Transferable rules for app runs

- Never design against an unverified assumption about tools, market, or intent.
- Always present options *with* a recommendation; make the founder's decision cheap.
- Extract from reality (repos, competitors, data) before inventing.
- Surface discrepancies the moment they're found; never silently substitute.
- Artifacts over conversation: if it isn't in a file, it didn't happen.
- Log decisions with the *why*, and keep an explicit open-questions table with leanings.
- End every working session with: what was produced, what was decided, what's open,
  what happens next.

## Observed founder patterns (updated per session)

These are *how the founder actually works*, distilled from sessions — agent profiles
should emulate them:

1. **Answers are terse and decision-shaped.** When given numbered questions, he replies
   with numbered decisions. Agents should ask questions that can be answered that way —
   concrete, with a default on the table — and never make deciding expensive.
2. **Asks for pros/cons before accepting a recommendation on things that matter.**
   A leaning is not enough on consequential choices ("what's the pros/cons to sticking
   with OpenClaw vs switching?"). Agents must be able to defend a recommendation with a
   tradeoff table on demand.
3. **Sequences pragmatically — cheapest viable step first, upgrade when the need is
   real.** Home machine before VPS; plugin before dedicated service; template before
   cloud agents. Never build ahead of the need. The corollary the org must respect:
   record *when* the upgrade triggers, so deferral isn't drift.
4. **Actively guards against organizational bloat.** Named it unprompted: "too many
   agents… scaling too fast, bureaucracy… we wanna avoid." Default answer to "should we
   add a role/process/tool?" is no, unless a bottleneck is named.
5. **Corrects interpretation drift immediately and expects re-alignment.** When the
   agent misread "learning from me" (as learning his refinement habits generally rather
   than from the live session), he clarified in one message. Agents must treat such
   corrections as high-priority context, update artifacts to match, and not repeat the
   misreading.
6. **Wants standing rhythm plus ad-hoc override.** Scheduled steering (standup) with the
   explicit right to interject anytime and redirect. Structure never locks him out.

## Session log

| # | Date | What happened |
|---|---|---|
| 1 | 2026-08-02 | Idea → clarification → research → options → decisions D1–D8 → foundation docs written. Open: O1–O6, functionality shakeout. |
| 2 | 2026-08-02 | Shakeout round 1: standup timing (D9), Slack sequencing after pros/cons discussion (D10), org restraint (D11), home-machine hosting (D12), session-as-training-data clarified (D13). First "observed founder patterns" distilled. |
| 3 | 2026-08-02 | Full build-out on founder's "build everything" directive: agent profiles (4 active + 8 dormant), 4 playbooks, OpenClaw workspace (identity + 5 skills + Slack patch + automations), app template (event-sourced core, analytics seam, brand-pack tooling — check gate green, 12 tests), stamp-app pipeline, git repo, onboarding README. Pattern reinforced: verify tool mechanics (OpenClaw docs) before writing setup instructions; ship with the gate green, not "should work." |
