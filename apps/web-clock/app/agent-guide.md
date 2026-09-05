# Agent Guide — App Template

Single source of truth for agents working in this template or in an app stamped from
it. `AGENTS.md` and `CLAUDE.md` are symlinks — edit `agent-guide.md`, never the symlinks.
The full principles live in `~/src/app-factory/docs/03-coding-principles.md`; this file
is the operational digest.

## Where things live

| Path                                   | What                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `packages/core`                        | Platform-free domain: events, projections, seams. `"types": []` — Node/DOM globals are compile errors here.             |
| `packages/analytics`                   | Typed analytics seam. Raw provider calls outside an adapter are forbidden.                                              |
| `tools/`                               | Brand-pack validation + token generation (Node allowed here).                                                           |
| `mobile-overlay/`                      | Shell layer applied onto a fresh `create-expo-app` by `scripts/stamp-app.sh`.                                           |
| `spec-scaffold/`                       | Copied into each new app workspace by the `factory-new-app` skill; its `brand-pack/` doubles as the valid test fixture. |
| `src/context/app-context.ts` (in apps) | THE composition root — the only file that instantiates concrete impls.                                                  |
| `src/design/` (in apps)                | Tokens (generated) + primitives. Zero raw hex/px anywhere else.                                                         |
| `documents/decisions/`                 | ADRs. Read before "fixing" anything that looks odd.                                                                     |

## Commands

```sh
npm install        # once, at template root
npm run check      # typecheck + format:check + test — run before finishing ANY task
npm run generate-tokens -- <brand-pack-dir> <out-file>   # in tools/
./scripts/stamp-app.sh <codename> <app-workspace>        # create a new app
```

## Standards (the ones that get violated)

1. Domain logic goes in `packages/core` (or the app's feature module when app-specific)
   — never in screens. Vendor types never cross a package boundary.
2. Durable state = events through the bus (persistence-first is wired at the root).
   Reads = projections that re-fold. High-frequency live state = `Cell`, not events.
3. New implementation? Adapter file + one line in the composition root. Nothing else.
4. Events and analytics names: `category-entity-action`, lowercase-hyphenated.
   Analytics events must exist in the spec before they exist in code.
5. All pro-gating reads the `Entitlements` seam. No scattered `isPro` flags.
6. Kebab-case filenames everywhere. No `any`. Comments only for constraints code
   can't show.

## Things that look wrong but are deliberate

- **No Expo app is vendored here** — stamping creates it fresh (ADR 0003).
- **`InMemory*` implementations ship in `src`** — they're the dev/test seam, not cruft.
- **Core has `"types": []`** — do not "fix" a missing global by adding Node types;
  the compile error is the feature.
- **The generated tokens file is committed in apps** — regenerate via the brand pack;
  never hand-edit (`*.generated.ts` is prettier-ignored).
- **No ESLint yet** — `check` is typecheck+format+test. ESLint config lands with the
  first stamped app (recorded trigger, decision log O-item). Don't add it casually
  to the template root without wiring it into every workspace.

## Working agreements

- Run `npm run check` before finishing any task. Never mark your own work verified.
- Expo APIs: read the versioned docs at docs.expo.dev for the app's SDK before writing
  code. Expo changes between SDKs; your memory of it is stale.
- Template changes are PRs reviewed at standup — apps pin a template version
  (`factory.json`), they don't track HEAD.
- New dependency? Tech-lead sign-off first (lock-in, license, cost).
