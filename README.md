# App Factory

An autonomous app company. Ideas go in through conversation; well-designed, well-tested,
individually-branded mobile apps come out — along with their marketing. Operated by an
agent org (orchestrated through OpenClaw) with the founder steering via a daily standup
and three approval gates.

- **Docs:** `docs/` — vision, architecture, agent org, coding principles, brand system,
  product process, integrations, roadmap. Decisions: `docs/process/decision-log.md`.
- **Agents:** `agents/` — active profiles (chief-of-staff, product-lead, tech-lead,
  app-engineer) + dormant charters. Org restraint rule: D11.
- **Playbooks:** `playbooks/` — ux, monetization, aso, analytics taxonomy.
- **OpenClaw workspace:** `openclaw/` — chief-of-staff identity, factory skills,
  Slack config patch, automations script.
- **Template:** `template/` — event-sourced core + analytics seam + brand-pack tooling
  (`npm run check` green), and `scripts/stamp-app.sh` to mint new apps.
- **State:** `STATE.md` — the factory's current truth, maintained by the chief of staff.

---

## Getting online — step by step

Follow in order. Each step ends with a verification. Total time ≈ 45–60 min, most of it
the Slack app.

### Step 0 — Prerequisites

- macOS with Node ≥ 22 (`node --version`)
- An Anthropic API key (or Claude subscription auth) for OpenClaw's model
- Admin access to a Slack workspace you're happy to run the factory in

### Step 1 — Verify the template

```sh
cd ~/src/app-factory/template
npm install
npm run check
```

**Verify:** ends with all workspaces passing (typecheck + format + 12 tests). This is
the same gate every agent runs before finishing any task.

### Step 2 — Install OpenClaw

```sh
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

The onboarding wizard asks for your model provider — use your Anthropic key and pick
the strongest available Claude model. `--install-daemon` sets up a LaunchAgent so the
gateway survives reboots (we're on your local machine per D12; the machine must be
awake for crons to fire — check System Settings → prevent sleep, or accept missed
crons until the Phase 3 VPS move).

**Verify:**

```sh
openclaw --version && openclaw doctor && openclaw gateway status
```

### Step 3 — Install the factory workspace

Give the chief of staff its identity and skills. Find your workspace directory
(`openclaw doctor` or the onboarding output shows it; commonly `~/.openclaw/workspace`),
then symlink the factory files so the repo stays the single source of truth:

```sh
WORKSPACE=~/.openclaw/workspace   # adjust if doctor shows a different path
mkdir -p "$WORKSPACE/skills"
ln -sf ~/src/app-factory/openclaw/workspace/AGENTS.md "$WORKSPACE/AGENTS.md"
for s in ~/src/app-factory/openclaw/workspace/skills/*/; do
  ln -sfn "$s" "$WORKSPACE/skills/$(basename "$s")"
done
openclaw gateway restart 2>/dev/null || true
```

**Verify:** in the OpenClaw Control UI / WebChat (it prints its local URL; default port
18789), send: `who are you and what skills do you have?` — it should answer as the
App Factory Chief of Staff and list the five `factory-*` skills.

### Step 4 — Connect Slack

1. In Slack, create the channels: `#factory-standup`, `#factory-approvals`,
   `#factory-builds`. Note each channel ID (right-click channel → Copy link → the
   `C...` segment) and your own member ID (profile → ⋯ → Copy member ID, `U...`).
2. Create the Slack app: <https://api.slack.com/apps/new> → "From a manifest" → paste
   OpenClaw's **recommended manifest** (linked from docs.openclaw.ai/channels/slack).
   Install it to your workspace.
3. Collect two tokens:
   - **Bot token** `xoxb-...` — Install App page
   - **App-level token** `xapp-...` with `connections:write` — Basic Information →
     App-Level Tokens (this enables Socket Mode; no public URL needed)
4. Edit `~/src/app-factory/openclaw/slack.patch.json5`: replace the three
   `C_REPLACE_*` channel IDs and `U_REPLACE_FOUNDER` with the real IDs from (1).
5. Apply:

```sh
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_APP_TOKEN=xapp-...
# make them available to the daemonized gateway too (e.g. add to the LaunchAgent env
# or your shell profile that the gateway inherits), then:
openclaw config patch --file ~/src/app-factory/openclaw/slack.patch.json5
openclaw channels status --probe
```

6. Invite the bot to the three channels (`/invite @<bot>` in each).

**Verify:** DM the bot in Slack: `status` → it should run the `factory-status` skill
and answer from `STATE.md`. In `#factory-standup` (no mention needed): `run standup`
→ it posts a standup-format message.

### Step 5 — Schedule the rhythm

```sh
export FACTORY_STANDUP_CHANNEL=C...   # the #factory-standup channel ID
~/src/app-factory/openclaw/setup-automations.sh
openclaw automations list
```

This registers: **08:00** daily standup, **11:00** cutoff sweep, **18:00** end-of-day
state sync. (Flag names evolve — if the script errors, check
`openclaw automations create --help` and adjust; the jobs' prompts are in the script.)

**Verify:** `openclaw automations list` shows the three jobs. Tomorrow 08:00 the
standup appears in `#factory-standup`; reply in-thread and watch it re-plan.

### Step 6 — Start your first app

In Slack (DM or `#factory-standup`):

> new app idea: <your idea in a sentence or two>

The chief of staff runs `factory-new-app`: clarifies if needed, creates
`apps/<codename>/` from the spec scaffold, and dispatches a product-lead session for
stages 1–2. From here the product process (`docs/05-product-process.md`) drives:
refinement → market check → brand → design → architecture → **your spec approval** →
build → **your submission approval**.

When the spec is approved and the brand pack is complete, stamping the app is:

```sh
cd ~/src/app-factory/template
./scripts/stamp-app.sh <codename> ~/src/app-factory/apps/<codename>
```

(needs network; creates the Expo app, applies the factory overlay, generates brand
tokens, installs deps).

### Step 7 — When you're ready to ship (Phase 1/2 checklist)

Not needed for the factory to be "online," but required before the first store build:

- [ ] Apple Developer Program account + Google Play Console account
- [ ] `npm i -g eas-cli && eas login` (Expo account)
- [ ] Per-app `eas.json` (development/preview/production ⇄ OTA channels — see
      `docs/06-integrations.md`); store credentials live in EAS/CI only, never OpenClaw
- [ ] RevenueCat account when the first monetized app reaches build (playbook:
      `playbooks/monetization.md`)
- [ ] Resolve O2 (analytics provider — leaning PostHog) before wiring analytics

Roadmap with exit criteria per phase: `docs/07-roadmap.md`.

---

## Daily operation (once online)

- **08:00** standup posts. Reply in-thread by **11:00** to steer; silence = the posted
  proposal proceeds. Gates always wait for you regardless.
- Message the bot **any time** for status (`status`, `how's <app>?`) or steering —
  it re-plans immediately.
- Approvals arrive in `#factory-approvals` as clear asks; reply
  `approve spec <app>` / `approve submission <app>` / `approve calendar <app>`
  (buttons come with the Phase 3 Bolt service, D10).

## Safety posture (D7)

Three human gates: spec, store submission, weekly marketing calendar. OpenClaw never
holds store/social/payment credentials; publishing is staged, never automatic. Slack
access is allowlisted to the factory channels and your DMs.
