# Roadmap

Phased so that every phase ends with something working end-to-end. Resist building the
factory before one app has gone through the line by hand.

## Phase 0 — Foundation (current)

- [x] Foundation docs (this set)
- [x] First shakeout round with founder (D9–D13 logged; O1/O3 resolved)
- [x] Agent profiles in `agents/` — minimal active set (D11) + 8 dormant charters
- [x] Playbooks: ux, monetization, aso, analytics-taxonomy
- [x] OpenClaw workspace built: chief-of-staff identity, 5 factory skills,
      Slack config patch, automations script
- [ ] Founder runs README "Getting online" steps (OpenClaw install → Slack → crons)
- [ ] Resolve remaining open decisions (analytics provider O2, coding-agent runtime O4)

**Exit:** standup appears in Slack at 08:00 every morning; founder can reply (or message
at any time) and see the chief of staff re-plan.

## Phase 1 — Template

- [x] Template built in `template/` per `04-template-brand-system.md`: workspaces,
      event-sourced core (+tests), analytics seam (+tests), composition-root overlay,
      agent-guide + ADRs, `stamp-app.sh` pipeline
- [x] Brand-pack → generated tokens pipeline working (validated example pack + tests)
- [x] `npm run check` green locally; CI workflow committed (runs on first push to GitHub)
- [ ] First stamped app boots (`stamp-app.sh` + `expo start`) — validates ADR 0003 flow
- [ ] Pre-wired shell features hardened in a real app: onboarding, paywall (RevenueCat),
      settings, EAS profiles (these are seams + configs today, not running screens)
- [ ] Maestro flows running against a stamped app
- [ ] Apple & Google developer accounts ready; one throwaway internal app submitted to
      TestFlight/internal track to validate the pipeline

**Exit:** a new app can be stamped from the template + a hand-written brand pack, build
green, install on the founder's phone, in under a day.

## Phase 2 — First app, founder-guided

- [ ] Pick app #1 idea; run the full product process (stages 0–11) with the founder
      participating in refinement — deliberately slow, to calibrate the process docs
- [ ] Coding agents build the custom 20% under Tech Lead review
- [ ] Ship through both gates; launch marketing manually-ish
- [ ] Retro: fix process docs + template from what broke

**Exit:** app #1 live in both stores with its landing page and first content cycle.

## Phase 3 — Automate the org

- [ ] Chief-of-staff delegation loop: standup → task decomposition → sub-agent dispatch
      → lead review → status, with founder touch only at standup + gates
- [ ] Dedicated Slack Bolt service (fin-news pattern, D10) replaces the OpenClaw plugin;
      approval-gate buttons live in `#factory-approvals`
- [ ] Migrate OpenClaw + services from home machine to VPS (D12) — cron-driven
      standups/marketing must not miss. Runbook + threat model:
      `docs/09-deployment-and-security.md` (Linux guest; no macOS needed — all rigs
      build via EAS cloud). Open questions await founder at standup.
- [ ] Marketing engine: content generation, weekly calendar review, cron posting,
      nightly analytics digest
- [ ] App #2 runs with the founder ONLY at standup + gates; measure where it stalls

**Exit:** founder's involvement ≈ 30 min/day while an app moves through the line.

## Phase 4 — Portfolio operations

- [ ] Multiple concurrent apps; move coding sessions to cloud agents if the box saturates
- [ ] Revenue-driven weekly reallocation; rebrand/kill recommendations with founder decision
- [ ] First rebrand-in-place or fork exercise to prove the brand system
- [ ] Cadence discipline: 2–4 quality releases/month max (store-policy guardrail)

**Exit:** the portfolio loop runs: data in, decisions at standup, effort reallocated.
