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

The onboarding wizard asks for your model provider — use your Anthropic key or Claude
subscription auth and pick the strongest available Claude model. `--install-daemon`
sets up a LaunchAgent so the gateway survives reboots (we're on your local machine per
D12; the machine must be awake for crons to fire — check System Settings → prevent
sleep, or accept missed crons until the Phase 3 VPS move).

Notes from the 2026-08-02 bring-up (OpenClaw 2026.7.1-2):

- Non-interactive auth uses `--auth-choice anthropic-cli` (the `claude-cli` name is
  deprecated). It reads `~/.claude/.credentials.json` — which does not exist on macOS
  when Claude Code stores OAuth in the Keychain. Materialize it first (may prompt for
  Keychain access):
  `security find-generic-password -s "Claude Code-credentials" -w > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json`
  The daemonized gateway reads this file at runtime too (Keychain prompts are
  disallowed on non-interactive paths).
- If `openclaw doctor` afterwards reports a missing `anthropic:claude-cli` auth
  profile, the suggested `models auth login` fix needs a TTY; in automation run it
  under `script -q /dev/null`.

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
# REQUIRED for symlinked skills: OpenClaw only follows workspace-skill symlinks whose
# targets live under an allowlisted root (D14):
openclaw config set skills.load.allowSymlinkTargets '["~/src/app-factory/openclaw/workspace/skills"]'
openclaw gateway restart 2>/dev/null || true
```

Then complete the identity layer: the onboard seeds a `BOOTSTRAP.md` first-boot
interview that overrides our chief-of-staff persona until finished. The factory
identity is already defined, so pre-fill `IDENTITY.md`/`USER.md` (OpenClaw then
treats setup as complete) and delete `BOOTSTRAP.md`.

**Verify:** in the OpenClaw Control UI / WebChat (it prints its local URL; default port
18789) or via CLI (`openclaw agent --agent main --session-id verify -m "..."`), send:
`who are you and what skills do you have?` — it should answer as the
App Factory Chief of Staff and list the five `factory-*` skills.

### Step 4 — Connect Slack

0. Install the Slack channel plugin (not part of the stock install):

```sh
openclaw plugins install @openclaw/slack
openclaw gateway restart
```

1. In Slack, create the channels: `#factory-standup`, `#factory-approvals`,
   `#factory-builds`. Note each channel ID (right-click channel → Copy link → the
   `C...` segment) and your own member ID (profile → ⋯ → Copy member ID, `U...`).
2. Create the Slack app: <https://api.slack.com/apps/new> → "From a manifest" → paste
   `openclaw/slack-app-manifest.json` from this repo (verbatim copy of OpenClaw 2026.7's
   **recommended** Socket Mode manifest from docs.openclaw.ai/channels/slack; rename the
   bot in the Slack UI later if you like). Install it to your workspace.
3. Collect two tokens:
   - **Bot token** `xoxb-...` — Install App page
   - **App-level token** `xapp-...` with `connections:write` — Basic Information →
     App-Level Tokens (this enables Socket Mode; no public URL needed)
4. Create the single secrets file a fresh install needs — copy the example and fill
   in both tokens from (3), the three channel IDs, and your member ID:

```sh
cp ~/src/app-factory/openclaw/secrets.env.example ~/src/app-factory/openclaw/secrets.env
# edit secrets.env — it is gitignored; the repo only ever contains placeholders
```

5. Apply everything:

```sh
~/src/app-factory/openclaw/apply-slack.sh
openclaw channels status --probe
```

   The script renders `slack.patch.json5` (a `${VAR}` template — real IDs live only
   in `secrets.env`), validates with `--dry-run`, applies it, makes you command
   owner, exports both tokens into the daemon's service env file, and restarts the
   gateway. Notes learned the hard way:
   - the daemonized gateway does NOT inherit your shell env — token exports go to
     `~/.openclaw/service-env/ai.openclaw.gateway.env` (mode 600; regenerated if the
     service is ever reinstalled)
   - token fields use the canonical SecretRef form
     `{ source: "env", provider: "default", id: "..." }` — `{ $env: ... }` is not read
   - openclaw CLI calls in scripts need stdin detached (`< /dev/null`); they hang on
     a TTY check otherwise
6. Invite the bot to the three channels (`/invite @<bot>` in each).

**Verify:** DM the bot in Slack: `status` → it should run the `factory-status` skill
and answer from `STATE.md`. In `#factory-standup` (no mention needed): `run standup`
→ it posts a standup-format message.

### Step 5 — Schedule the rhythm

```sh
~/src/app-factory/openclaw/setup-automations.sh   # reads FACTORY_STANDUP_CHANNEL from openclaw/secrets.env
openclaw cron list
```

This registers: **08:00** daily standup, **11:00** cutoff sweep, **18:00** end-of-day
state sync. (OpenClaw 2026.7 notes, verified by live test-fire: the CLI verb is
`cron add`, not `automations create`; jobs that post to Slack run as **isolated
turns with `--announce`** so the gateway delivers the final message deterministically;
the EOD housekeeping job is a main-session `--system-event` (main jobs can't deliver);
agent jobs default to a 30s timeout, so the script sets explicit timeouts.)

**Verify:** `openclaw cron list` shows the three jobs. Tomorrow 08:00 the
standup appears in `#factory-standup`; reply in-thread and watch it re-plan.
Within 10 minutes the three channels' topics read `OpenClaw: online — heartbeat …`
(the `ai.openclaw.factory-heartbeat` LaunchAgent — needs the Step 4 manifest
re-applied and the app reinstalled, since topic writes use new scopes).

### Step 5b — Orchestrated runs (feature-dev / bug-fix on any rig)

The orchestration layer (`docs/08-orchestration-layer.md`, engine in
`orchestration/`) runs whole workflows against registered repos ("rigs"):
plan → founder approval → implement → deterministic checks → cross-model
review → tests → EAS preview update → Slack notification with install link + QR.

- Rigs are declared in `orchestration/rigs.json`: `running-with-pace` and
  `skip-hero` are **production tier** (full validation loop); `factory:<app>`
  resolves any `apps/<name>` as a **quickfire** rig (template checks only).
- From Slack (typed or voice note): "add feature X to pace" → the chief of staff
  runs the `factory-feature` skill, which drives
  `orchestration/bin/factory-run`. The plan lands in `#factory-builds` for
  approval; say "approve" (or "just do it" up front to skip the gate).
- From a shell: `orchestration/bin/factory-run start --rig skip-hero
  --workflow feature-dev --prompt "..."`; then `status` / `approve` / `steer` /
  `cancel`. `factory-run selftest` validates the setup.
- Runs execute in git worktrees under `orchestration/worktrees/` on branches
  named `factory/<run_id>` — main checkouts are never touched; merging is a
  separate, founder-confirmed step after the build is verified on-device.

**Voice notes:** fill `GROQ_API_KEY` (or `OPENAI_API_KEY`) in
`openclaw/secrets.env`, then run `openclaw/apply-voice.sh`. OpenClaw transcribes
Slack voice notes automatically and echoes the transcript in-thread.

**Verify:** `orchestration/bin/factory-run selftest` is green; send the bot a
voice note saying "status" and watch the transcript + reply.

**Factory web console:** a phone-friendly web UI over the same engine — run
list, per-run node graph with step telemetry (cost/tokens/duration), start
runs, and the full gate loop (approve / reject with feedback / steer / cancel):

```sh
orchestration/bin/factory-web        # builds the frontend on first launch,
                                     # generates + prints FACTORY_WEB_TOKEN once,
                                     # serves http://127.0.0.1:4620
```

The server binds 127.0.0.1 and requires the token for every API call. To reach
it from your phone, keep the loopback bind and put Tailscale in front:

```sh
tailscale serve --bg http://127.0.0.1:4620
```

then open `https://<machine>.<tailnet>.ts.net` on the phone and paste the token
(printed at first launch; stored in `orchestration/web/.token`). All mutations
shell out to `factory-run`, are rate-limited, and append to
`orchestration/web/audit.log`.

**Self-evaluation loop:** every run writes structured telemetry (commits, review
verdicts/findings, step durations, artifact links — never context dumps) to
`orchestration/telemetry.db`; `factory-run report` digests it. The `self-review`
workflow (weekly cron Sundays 17:00, or ask the bot to "review the factory")
analyzes that evidence, posts a one-improvement plan to `#factory-builds`, and on
your approval spawns a full feature-dev run on the `app-factory` rig itself —
implement → checks → cross-model review → **merge to main + gateway restart**.
The harness improves itself through the same validated pipeline as the apps.
Rollback: `git revert -m 1 <merge_sha>` + `openclaw gateway restart`.

### Step 5c — Slack connectivity watchdog

Twice in two days the gateway's Socket Mode connection went zombie — `openclaw
status` said "connected, healthy" while the bot was deaf. The watchdog is an
**independent launchd job** (every 5 min; deliberately not an openclaw cron, which
couldn't fire with the gateway wedged) that judges liveness from behavioral
evidence only — gateway-log inbound freshness plus a real probe send — and on a
wedged verdict runs `openclaw gateway restart` (max once per 30 min), re-verifies,
and posts a recovery notice to `#factory-builds`.

1. Create a dedicated **quiet** channel `#factory-watchdog` (probes land there
   whenever inbound traffic goes stale — keep it muted/out of human view) and
   `/invite` the bot.
2. Add its channel ID to `openclaw/secrets.env`: `FACTORY_WATCHDOG_CHANNEL=C...`
3. Install:

```sh
~/src/app-factory/openclaw/setup-watchdog.sh   # idempotent; --uninstall to remove
```

**Verify:** `node ~/src/app-factory/openclaw/watchdog.mjs --check-only` exits 0
(it never restarts or posts notices), and decisions append to
`/tmp/openclaw/watchdog.log`.

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
