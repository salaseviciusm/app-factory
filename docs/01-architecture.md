# Architecture

The factory is five subsystems around one orchestrator. OpenClaw is the **operations brain**
— always-on, chat-native, scheduled — but it is not the coding engine and not the CI/CD
system. It dispatches work to specialized subsystems and reports back to the founder.

```
                       ┌──────────────────────────────────────┐
  Founder (Slack /     │            OpenClaw Gateway          │
  WhatsApp / WebChat) ─┤  chief-of-staff agent · cron · memory │
                       └──────┬──────────┬──────────┬─────────┘
                              │          │          │
                 ┌────────────▼──┐  ┌────▼─────┐  ┌─▼──────────────┐
                 │ 1. Intake &   │  │ 2. Build │  │ 4. Marketing   │
                 │    Product    │  │   Org    │  │    Engine      │
                 │  (spec repos) │  │ (coding  │  │ (content, ASO, │
                 └────────┬──────┘  │  agents) │  │  posting, data)│
                          │         └────┬─────┘  └────────┬───────┘
                          │              │                 │
                          │     ┌────────▼────────┐        │
                          │     │ 3. Ship Pipeline │        │
                          └────►│ (CI, EAS, stores)│◄───────┘
                                └────────┬────────┘
                                         │
                                ┌────────▼────────┐
                                │ 5. Human Gates  │
                                │ (standup +      │
                                │  approvals)     │
                                └─────────────────┘
```

## 1. Intake & Product

- Ideas arrive via chat. The **product team** agents refine them through a structured
  process (see `05-product-process.md`): problem statement, target user, market sanity
  check, monetization model, feature brainstorm, interaction design.
- Output: a **spec repo** per app — `spec.md`, `architecture.md`, `features/`,
  `brand-pack/` — everything downstream is driven from files in git, never from chat memory.

## 2. Build Org (code generation)

- **Decision: template-first, agent-refined** (decision log D2). The app skeleton comes from
  our template (auth, IAP, analytics, paywall, navigation, theming pre-wired); agents build
  the app-specific ~20% on top, following `03-coding-principles.md`.
- OpenClaw's chief-of-staff dispatches build tasks to **coding agent sessions**
  (Claude Code / Agent SDK), one workspace per app, monitored via the standup and
  progress events. Team-lead agents review sub-agent output before it merges.
- Where code can't be shared, **principles are**: the coding-principles doc and per-domain
  playbooks (data, UI, testing) are loaded into every coding agent's context.

## 3. Ship Pipeline (deterministic — no LLM in the loop)

- React Native + **Expo / EAS**: one codebase → iOS + Android; EAS Build for cloud builds
  and signing; EAS Submit → App Store Connect API / Google Play Developer API.
- **EAS Update** for over-the-air JS fixes without store re-review — important when agents
  write the code and issues surface post-launch.
- GitHub Actions: lint, typecheck, unit tests, and **Maestro** E2E flows (YAML-based —
  agents can generate and maintain them alongside features).
- A build only reaches "submit" state after the pipeline is green AND the founder gate (5).

## 4. Marketing Engine

- Each app's brand pack includes a **marketing strategy**: positioning, ASO keyword set,
  channel plan, content calendar.
- Content generation (copy, screenshots, video scripts) via model APIs; assets staged for
  weekly founder review.
- **OpenClaw cron** drives scheduled posting to owned accounts and nightly analytics pulls
  (store analytics, RevenueCat, ad revenue) into a portfolio dashboard.
- The analytics loop is what makes this a portfolio: effort reallocates weekly toward
  traction, and underperformers get flagged for rebrand/kill recommendation.

## 5. Human Gates

Exactly three, all surfaced in Slack/chat:

| Gate | Trigger | Founder sees |
|---|---|---|
| Spec approval | Product process complete | Spec summary + brand pack preview |
| Submission approval | Green build ready | Screenshots + TestFlight/internal-track install link |
| Marketing calendar | Weekly | Next week's content & posting plan |

Everything else runs autonomously. Rationale: prompt-injection and account-loss risk for
credentialed actions; store-policy risk for publishing; brand risk for public posting.

## Key architectural decisions (see decision log for rationale)

- **D1** OpenClaw = orchestrator only; codegen and CI/CD are delegated subsystems.
- **D2** Option C (template-first) chosen over from-scratch generation or pure cloud agents.
- **D3** Specs, principles, and decisions live in git — agents are stateless against files.
- **D4** Daily standup as the primary steering mechanism; Slack as the primary founder surface.
- **D5** Brand identity is a swappable layer over a shared core (see `04-template-brand-system.md`).
