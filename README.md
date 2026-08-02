# App Factory

An autonomous app company. Ideas go in through conversation; well-designed, well-tested,
individually-branded mobile apps come out the other end — along with their marketing.

The factory is operated by an agent organization (orchestrated through OpenClaw) that mirrors
a real product company: product team, engineering leads, data engineering, QA, and a marketing
team. A human (Morkus) acts as founder/CEO: sets direction, joins the daily standup, and
approves the small number of irreversible actions (store submission, outreach).

## Core ideas

1. **Template-first, agent-refined.** ~80% of every app is a battle-tested template
   (auth, IAP, analytics, paywall, navigation, theming). Agents generate the differentiated
   ~20% — the app-specific features and interactions. Where code can't be reused, principles are.
2. **Brand as a swappable layer.** Every project carries a *brand pack* — theme tokens, voice,
   feature configuration, marketing strategy. Any app can be rebuilt under a different brand
   identity without touching its core logic.
3. **Quality over volume.** Apps go through a full product process — idea refinement,
   architecture design, feature/interaction brainstorming, testing — before they ship.
   Store policies (Apple 4.3 spam, Google Play repetitive content) make quality-gated cadence
   a survival requirement, not a nicety.
4. **The process is the product.** The way this repo itself was designed — a guided,
   conversational refinement between founder and agents — is the canonical process every
   app must go through. See `docs/05-product-process.md` and `docs/process/decision-log.md`.

## Repo map

| Path | What it is |
|---|---|
| `docs/00-vision.md` | What we're building and why |
| `docs/01-architecture.md` | The factory's five subsystems and how they connect |
| `docs/02-agent-org.md` | Agent roles/profiles, delegation model, standup ritual |
| `docs/03-coding-principles.md` | Engineering conventions (derived from running-with-pace & skip-hero) |
| `docs/04-template-brand-system.md` | The app template and the brand pack system |
| `docs/05-product-process.md` | Stage-gate process every app goes through |
| `docs/06-integrations.md` | OpenClaw, Slack, EAS/stores, analytics wiring |
| `docs/07-roadmap.md` | Phased implementation plan |
| `docs/process/decision-log.md` | Running log of decisions and their rationale |

## Status

**Phase: Foundation docs & process design.** We are currently shaking out functionality and
architecture through conversation, and recording that process as the exemplar the autonomous
company will follow.
