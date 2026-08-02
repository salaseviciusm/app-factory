# Coding Principles

Derived from `~/src/running-with-pace` (first generation) and `~/src/skip-hero` (current
generation — its architecture doc explicitly builds on a review of running-with-pace).
Where the two conflict, **skip-hero's convention wins**. These principles are loaded into
every coding agent's context; the template repo (`04-template-brand-system.md`) encodes
them as working code.

## 1. Portable core, thin shells

- The domain lives in a **pure TypeScript package with zero platform imports**
  (skip-hero: `packages/core` with `"types": []` in tsconfig so touching a Node/DOM global
  is a *compile error*). The Expo app is "a thin shell: capture, compose, render."
- Monorepo via **npm workspaces with source packages** — `"main": "./src/index.ts"`, no
  build step; Metro/vitest/tsx consume TS directly. Path-alias + dependency-sync-script
  integration (running-with-pace) is explicitly rejected (skip-hero ADR 0005).
- One hand-curated barrel per package (`src/index.ts`, explicit named exports, no `export *`).

## 2. Interfaces first, one composition root

- Contracts are small interfaces in core (`EventBus`, `EventStore`, `QueryLayer`,
  domain seams). Implementations are adapters. Vendor types never cross a boundary —
  core owns canonical types; adapters translate at the edge.
- **Exactly one composition root** per app (`src/context/app-context.ts`) is the only file
  allowed to instantiate concrete implementations. Compliance test (from skip-hero's
  agent guide): *swapping a package for a competitor must only create/change files inside
  its adapter, plus one line at the composition root.*
- Implementation selection (mock auth vs real, simulated vs live data source) happens at
  the composition root via env/config — never as branches inside business logic.
- Compose by decoration: `Caching(InMemory(storage))`, `PeriodicallyFlushing(api, storage)`.

## 3. Event-sourced durable state; projections for reads

- Durable state is an **append-only log of typed events**, zod-validated on write and read,
  each with UUID `id`, `timestamp`, `schemaVersion`. Nothing is updated or deleted —
  corrections are new events.
- Event types are discriminated unions built from `as const` string-literal arrays;
  names are `category-entity-action`, lowercase-hyphenated.
- **Reads are projections that re-fold the log** — never mutable mirrors that can drift.
  Optimize inside the projection when it hurts; the interface holds.
- **High-frequency live state bypasses the event system** (skip-hero ADR 0008): a small
  `Cell`/`Stream` observable + `useSyncExternalStore`. No Redux/Zustand/MobX. TanStack
  Query only where a server cache genuinely exists.
- Anything algorithm-derived records its **version**; old algorithm versions are frozen,
  new behavior ships as a new version string. Replays are deterministic folds.

## 4. Strict TypeScript, no exceptions

- `strict` plus `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`. `no-explicit-any: error`.
- `satisfies` and mapped types keep client/server contracts honest; the API interface is
  shared code, implemented by both sides.
- Prettier: single quotes, trailing commas, 100 cols. Filenames **kebab-case** everywhere,
  including components (`glow-text.tsx` exports `GlowText`).

## 5. Test the core, not the chrome

- vitest, tests in `tests/` beside `src/`, shared factories in `tests/helpers.ts`.
- **Replay/synthetic-fixture style**: build deterministic inputs from models of reality;
  committed real-world fixtures with human-verified ground truth where applicable.
- `InMemory*` implementations ship in `src` (not test-only) — testability comes from
  purity and seams, not mocking frameworks. No snapshot tests.
- Factory addition (not in reference repos): **Maestro E2E flows** for critical user
  journeys, written per-feature in the same cycle as the feature — required because agents
  write the code and the founder won't manually regression-test every app.
- The gate is `npm run check` = typecheck + lint + format + test, fanned out across
  workspaces via standard script names. **Run it before finishing any task** — plus CI
  (factory addition: the same `check` in GitHub Actions, since many agents ship here).

## 6. Design tokens, one source of truth

- One `design/tokens.ts` per app: `color`, `space`, `radius`, `type` ramps, `as const`,
  every token doc-commented with its *role*, not its value. **Zero raw hex/px in
  components** — lintable, and the seam that makes brand swapping possible
  (see `04-template-brand-system.md`).
- Plain `StyleSheet.create` referencing tokens. No styled-components/NativeWind/theme
  provider. Hand-rolled primitives in `design/`, exported through a barrel.

## 7. Docs and agent ergonomics are part of the code

- One `agent-guide.md` per repo; `AGENTS.md` and `CLAUDE.md` are **symlinks** to it.
  Structure: where things live → commands → standards → **"things that look wrong but are
  deliberate"** → working agreements.
- **ADRs** (`documents/decisions/`) for any decision a future agent might "helpfully" undo
  — uniform Context/Decision/Consequences, ending with explicit anti-instructions
  ("Do not unify these versions").
- A dated **current-state** doc agents must update on meaningful landings.
- Conventions that must be *executed* (not just known) become **Claude Code skills**
  (`.claude/skills/` with registry + constraints sections), per running-with-pace's
  `create-event-type` and `eas` skills.
- Keep docs concise; don't spawn `.md` files beyond the established set.
- Commits are coherent units; messages explain *why*.

## 8. Working agreements (for every agent)

- Reuse before creating; split when crowded; consistency over intensity.
- Never report your own work as verified — leads review, checks gate.
- When a request is ambiguous, touches multiple layers, or involves UX decisions:
  stop and interview (founder or lead) rather than guessing.
- Read the versioned docs for fast-moving deps (Expo) before writing code against them.

## Divergences from the reference repos (deliberate)

| Area | Reference repos | Factory |
|---|---|---|
| CI | skip-hero has none (local `check` only) | GitHub Actions runs `check` + Maestro — many agents, one gate isn't enough |
| E2E | none | Maestro flows required for critical journeys |
| Analytics/monetization | absent in both | first-class in the template (events defined at design stage; RevenueCat; privacy-respecting analytics) |
| Theming | skip-hero dark-only, bespoke | token file is generated from the brand pack; light/dark both supported unless brand says otherwise |
