# The Product Process

Every app the company builds goes through this stage-gate process. It is deliberately the
same process we are using to build the factory itself — the founder guides, agents draft,
decisions get logged, and each stage produces reviewable artifacts before the next begins.

> **The canonical example is this repo's own creation.** See
> `process/decision-log.md` and `process/example-run.md` for how idea → docs → architecture
> → plan unfolded conversationally. When in doubt about "how much rigor," match that example.

## Stages

```
0. Spark        → one-paragraph idea, from anyone/anywhere (chat)
1. Refinement   → problem, user, why-now, monetization hypothesis        [Product Lead]
2. Market check → competitors, ASO landscape, differentiation angle      [Researcher]
3. Brand        → name, identity, voice, theme tokens → brand pack       [Brand Designer]
4. Design       → feature brainstorm, interaction design, screen map     [UX + Product]
5. Architecture → template delta: what's config, what's custom code      [Tech Lead]
   ── GATE: founder approves spec + brand pack ──
6. Build        → iterative implementation with lead review              [Engineering]
7. Test         → unit + Maestro E2E + manual QA script                  [QA]
8. Stage        → store metadata, screenshots, release notes             [Release Mgr]
   ── GATE: founder approves submission (sees installable build) ──
9. Launch       → submit, monitor review, publish landing page           [Release Mgr]
10. Market      → execute strategy, weekly calendar                      [Marketing]
    ── GATE: founder approves weekly marketing calendar ──
11. Learn       → analytics review, retro, feed learnings back           [Data + CoS]
```

## Stage rules

- **Every stage produces files in the app's spec repo.** No stage is "done" verbally.
- **Stages 1–5 are conversational with the founder** when the founder is available —
  that dialogue *is* the refinement mechanism. Agents propose; the founder redirects.
  When the founder is not available, agents complete a full draft and queue questions
  for standup rather than blocking.
- **Kill early, kill cheap.** Stage 2 exists to kill weak ideas before design effort.
  The Researcher's output must include an honest "reasons not to build this" section.
- **Design before build, always.** Stage 4 must produce: feature list ranked
  must/should/later, screen inventory, and interaction notes for anything non-obvious.
  Stage 5 must express the app as a *delta on the template*: which features are pure
  configuration, which need custom code, and where that code lives.
- **Build is iterative, not one-shot.** Engineers work feature-by-feature; the Tech Lead
  reviews each merge against principles; QA writes the Maestro flow for a feature in the
  same cycle it's built.
- **Nothing self-certifies.** The agent who built a thing is never the one who verifies it.

## The daily standup (steering loop)

Defined in `02-agent-org.md`. In process terms: the standup is where stage transitions,
blockers, and founder guidance happen. An app moves through stages across days, with the
founder nudging at standup rather than micromanaging in-flight work.

## Refinement quality bar (what "well thought-out" means)

Stage 1–4 outputs should answer, in writing:
- Who opens this app on a random Tuesday, and why? (retention hypothesis)
- What's the one interaction that makes it feel great? (the "20%" worth custom-building)
- What will we measure to know it's working? (events defined *before* build)
- Why won't Apple 4.3 flag this as another template app? (genuine differentiation)
- How does the monetization model match usage frequency? (subscription needs habit;
  one-time IAP suits utility; ads need volume)

## Learning loop

- Stage 11 retro proposals become PRs against `docs/` and the template. Reviewed at standup.
- The decision log per app records *why* choices were made, so a later rebrand/rebuild
  (see `04-template-brand-system.md`) doesn't relitigate settled questions.
