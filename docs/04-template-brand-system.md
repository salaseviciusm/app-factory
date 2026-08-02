# Template & Brand System

The mechanical heart of the factory: **one template, many brands**. ~80% of every app is
shared, battle-tested code; the brand pack + custom features are the differentiated ~20%.
The same core app can be rebuilt under a different brand identity — theming, copy, feature
mix, marketing strategy — without touching core logic.

## The app template (`template/` — future repo `app-template`)

A workspace-based Expo monorepo following `03-coding-principles.md`, with the boring 80%
pre-wired and tested:

```
packages/core            # pure-TS domain scaffolding: event system, projections, zod schemas
packages/analytics       # typed analytics events seam + provider adapter
apps/mobile
  src/context/           # composition root (the only place impls are wired)
  src/design/            # tokens.ts — GENERATED from brand pack, never hand-edited
  src/impl/              # adapters: storage, IAP (RevenueCat), analytics, notifications
  src/features/          # app-specific features land here (the custom 20%)
  app/                   # expo-router: onboarding, paywall, settings, main shell
agent-guide.md           # symlink target for AGENTS.md / CLAUDE.md
documents/decisions/     # ADR system, seeded with factory-wide ADRs
.maestro/                # E2E flows: onboarding, purchase, core journey
.github/workflows/       # check + Maestro on PR
eas.json                 # development / preview / production ⇄ OTA channels
```

Pre-wired capabilities (each behind a seam, each removable by config):
onboarding flow, paywall + subscriptions/IAP (RevenueCat), analytics events, push
notifications, settings, legal/privacy screens, OTA updates (EAS Update), app review
prompt, deep links.

**Template evolution policy:** the template is versioned. Apps pin a template version;
retro learnings (stage 11) land as template PRs; upgrading an app to a newer template
version is a scheduled task, not automatic.

## The brand pack (`brand-pack/` inside each app's spec repo)

Everything that makes an app *this brand* and not another, in machine-consumable form:

```
brand-pack/
  brand.md            # positioning, personality, audience, naming rationale
  voice.md            # copy tone, vocabulary, do/don't examples (feeds all UX copy + marketing)
  identity.json       # name, bundle id, scheme, store metadata fields
  tokens.json         # color ramps, type scale, radius, spacing, light/dark support
  features.json       # which template capabilities are on/off + config (paywall style,
                      # onboarding steps, monetization model)
  marketing.md        # strategy: channels, ASO keyword set, content pillars, cadence
  assets/             # icon source, splash, screenshot templates
```

Build-time flow: `tokens.json` → generates `src/design/tokens.ts` (doc comments included);
`identity.json` → app.config.ts values; `features.json` → composition-root wiring;
`voice.md` → context for every agent writing user-facing copy.

## Rebranding / rebuilding

Because brand is a layer, three operations become cheap:

1. **Rebrand in place** — same app, new identity (new tokens, copy pass, new store
   listing). Days, not weeks. Use case: an app whose mechanics test well but whose
   positioning missed.
2. **Fork under a new brand** — same core, different feature configuration + brand,
   shipped as a separate app targeting a different audience. Use case: a "runner's
   interval timer" core re-shipped as a "HIIT gym timer." ⚠ Bounded by store spam policy:
   forks must be genuinely differentiated in features/audience, not palette swaps.
3. **Template uplift** — improvements discovered in one app flow back to the template and
   reach every future app.

## Where reuse is principles, not code

Some things can't be a library — they're judgment. Those are captured as:
- `03-coding-principles.md` (engineering judgment)
- per-domain playbooks (planned: `playbooks/ux.md`, `playbooks/aso.md`,
  `playbooks/monetization.md`, `playbooks/analytics-taxonomy.md`)
- ADRs with anti-instructions, so future agents don't undo settled decisions
- Claude Code skills for procedures (create-event-type, release, generate-brand-tokens)
