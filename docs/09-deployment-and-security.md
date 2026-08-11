# Deployment & Security: Portable Factory Host

> Status: design + runbook. Written 2026-08-05 for founder review at standup.
> Supersedes the deployment half of D12 if adopted; the security half is new.
> Scripts in §6 are reference implementations — **written, not yet executed**.
> Nothing in this document has been applied to a live host.

## 1. Why this exists

Today the factory runs as the founder's own macOS user, with the OpenClaw gateway
as a LaunchAgent, full read/write access to `~`, and the founder's own credentials
in ambient reach. That was the right call while the factory was being built (D12 —
cheapest iteration loop). Two things have changed:

1. **Autonomy is arriving.** Cron-driven standups, the watchdog, orchestrated
   feature runs in worktrees, and sub-agent dispatch all execute without a human
   watching each command. Supervision is no longer the primary control.
2. **The stack turned out to be portable.** Every rig deploys via EAS
   (`orchestration/rigs.json` → `deploy.type: eas-update`), and EAS builds run in
   Expo's cloud. Nothing in the factory needs local Xcode. See §3.

The goal of this document: **one host definition that deploys identically to a
local VM or a rented remote VM**, with a security posture appropriate to an agent
that runs unattended.

## 2. Threat model — what we are actually defending against

Ranked by likelihood × impact, not by how dramatic they sound.

| # | Threat | Likelihood | Current exposure | Primary control |
|---|---|---|---|---|
| T1 | **Prompt injection → misuse of granted access.** Untrusted content (web page, PR body, issue, dependency README, Slack message from a non-founder) contains instructions the agent follows. | High | Full: agent has repo write, Slack post, shell | Least privilege + egress allowlist + branch protection + human review. **Isolation does not help here.** |
| T2 | **Credential exfiltration.** Secrets read and sent somewhere. | Medium | `openclaw/secrets.env` is readable by any process/agent step; Slack tokens are workspace-scoped | Egress allowlist, per-service scoped tokens, secrets outside agent-readable paths |
| T3 | **Destructive local command.** A bad `rm`, force-push, or `git reset --hard` on real work. | Medium | Host-wide: `~/.ssh`, `~/src`, iCloud, Keychain all in reach | VM boundary + snapshots + branch protection |
| T4 | **Supply-chain execution.** `npm install` on a rig runs a malicious postinstall. | Medium | Host-wide | VM boundary + egress allowlist |
| T5 | **Host compromise via the gateway.** Network-exposed service exploited. | Low | Gateway is local-bound today | Keep it local-bound / behind Tailscale; never public |
| T6 | **Provider compromise** (if renting). | Low | N/A today | Full-disk encryption, keep secrets minimal, prefer local if it matters |

**The load-bearing insight:** T1 is the most likely threat and the *least* helped
by containers or VMs. Isolation caps the blast radius of T3/T4 and buys clean
recovery; it does nothing about an agent doing a legitimate-looking wrong thing
with access it was deliberately given. Both layers are needed, and they are
different layers:

- **Isolation** (VM) protects *the host and the founder's data*.
- **Privilege design** (scoped tokens, branch protection, egress allowlist, review
  gates) protects *the assets the agent can reach*.

Do not trade one for the other. Specifically: **keep command approvals on inside
the VM.** "It's sandboxed" is not a reason to stop asking.

## 3. Finding: the factory does not need macOS

Checked 2026-08-05 across all rigs:

| Rig | Mobile toolchain | Build path | Needs local macOS? |
|---|---|---|---|
| `running-with-pace` | Expo (`pace-react-native/eas.json`; `ios/` is prebuild output) | EAS cloud → `eas-update` preview | No |
| `skip-hero` | Expo (`apps/mobile/eas.json`) | EAS cloud → `eas-update` preview | No |
| `planex-quoter` | Node/TS monorepo | n/a | No |
| `fin-news` | Node/TS service | n/a | No |
| `app-factory` | Node/TS + shell | `harness-restart` | No |
| `factory:<app>` (quickfire) | template, `npm run check` | none | No |

The only macOS-only activity remaining is **running a simulator for manual QA** —
a founder activity, on the founder's machine, not an agent activity.

**Consequence:** target a **Linux guest**. This removes the macOS-VM constraints
entirely (Apple ID / iCloud unavailable in VMs, 2-VM licence limit, Mac-only
hosting at €80–200/month) and opens up commodity hosting at €15–25/month.

**If this ever changes** (a rig moves to bare React Native or needs local
`xcodebuild`), the escape hatches, in order of preference: (a) keep EAS for CI
builds and do local Xcode work on the founder's Mac outside the factory boundary;
(b) macOS VM via [Tart](https://tart.run) on the founder's Mac — Apple permits 2
macOS VMs per host, simulators and `xcodebuild` work, code-signing works via App
Store Connect API keys; (c) rented Mac (Scaleway Apple silicon, MacStadium).
Record as a decision if it happens.

## 4. Target architecture

```
  Founder (Mac)                          Factory host (Linux VM — local OR rented)
  ────────────                           ─────────────────────────────────────────
   Slack ──────────────────────────────►  openclaw gateway (systemd --user)
   (only founder surface)                    │
                                             ├─ crons: standup 08:00, cutoff 11:00,
   Tailscale SSH ──────────────────────►     │         digest 18:00, self-review Sun 17:00
   (admin only, no public :22)               ├─ watchdog (systemd timer, NOT an openclaw cron)
                                             ├─ factory-run engine → git worktrees
                                             └─ sub-agent sessions
                                             │
                                        ┌────┴─────────────────────────────┐
                                        │ /srv/factory        (repos)      │
                                        │ /srv/factory-state  (persistent) │
                                        │ /run/secrets        (0600, root) │
                                        └──────────────────────────────────┘
                                             │
                                        egress allowlist (nftables)
                                             │
                          api.anthropic.com · slack.com · github.com
                          registry.npmjs.org · expo.dev/EAS · groq/openai
```

**Invariants that make it portable:**

1. **The host is defined by code, not by hand-setup.** One idempotent provisioning
   script takes a bare Ubuntu 24.04 LTS box to a working factory.
2. **Exactly two inputs.** The `app-factory` repo, and a secrets bundle injected at
   provision time. Nothing else is hand-placed, ever. If a fix requires an
   undocumented manual step, the fix is wrong — put it in the script.
3. **State is a known set of paths** (§5) that can be tarred, moved, and restored.
4. **Local and remote differ only in the bootstrap line.** After the VM exists and
   has SSH, provisioning is byte-identical.
5. **No host mounts.** Repos are cloned inside the VM. Sharing `~/src` from the
   Mac would reopen exactly the hole the VM closes. Convenience is not worth it.

## 5. State inventory — what must survive a rebuild

Everything else is reproducible and should be treated as disposable.

| Path (in VM) | Contents | Backup |
|---|---|---|
| `/srv/factory-state/openclaw/` | Gateway config, session store, memory, workspace (`SOUL.md`, `USER.md`, `MEMORY.md`, `memory/`) | Nightly, encrypted |
| `/srv/factory-state/telemetry.db` | `orchestration/telemetry.db` — run history feeding self-review | Nightly |
| `/srv/factory-state/runs/` | `orchestration/runs/` — run artifacts | Nightly |
| `/run/secrets/factory.env` | Slack + model + voice credentials | **Not backed up** — held in the founder's password manager, re-injected on rebuild |
| Git repos under `/srv/factory/` | Working state | Not backed up — origin is the source of truth; unmerged worktrees are expendable by design |

`orchestration/worktrees/` is deliberately excluded: worktrees are per-run and
recreatable, and treating them as precious is how you end up afraid to rebuild.

**Restore drill:** provision a fresh VM → restore `/srv/factory-state` → inject
secrets → start gateway. This should be exercised once before it is needed. Put it
on the Phase 3 checklist.

## 6. The runbook

### 6.0 Prerequisites (both paths)

- The `app-factory` repo reachable via a deploy key (§7.1).
- Secrets bundle assembled from `openclaw/secrets.env.example`.
- Anthropic auth. **Note the wrinkle:** the current bring-up materialises
  `~/.claude/.credentials.json` from the macOS Keychain (README Step 2). On Linux
  there is no Keychain — use an **Anthropic API key in the env** instead, or copy
  a credentials file in as part of the secrets bundle. This is the one auth
  difference between the current host and the target, and it needs a decision
  (§9, Q3).

### 6.1 Bootstrap — local VM

Any of these produce an Ubuntu 24.04 box with SSH; pick one, they are equivalent
from provisioning onward.

```sh
# Option A — multipass (simplest on macOS)
brew install multipass
multipass launch 24.04 --name factory --cpus 4 --memory 8G --disk 60G
multipass exec factory -- sudo apt-get update

# Option B — UTM / Lima / OrbStack: create an Ubuntu 24.04 VM, enable SSH.
```

Snapshot support matters more than the tool choice — you want a clean pre-run
snapshot to roll back to.

### 6.2 Bootstrap — rented remote VM

| Provider | Spec | Approx cost | Notes |
|---|---|---|---|
| Hetzner Cloud | CAX21 (4 vCPU ARM, 8 GB) | ~€7–9/mo | Best value; ARM is fine for Node |
| Hetzner Cloud | CPX31 (4 vCPU x86, 8 GB) | ~€15/mo | If anything needs x86 |
| Scaleway | equivalent | ~€15–20/mo | EU |
| Fly.io / DO | equivalent | ~€20–25/mo | Convenience premium |

*Prices from memory, 2026 — verify before committing.*

```sh
# Create with cloud-init that only installs the SSH key and creates the user;
# everything else is the provisioning script, so local and remote converge here.
hcloud server create --name factory --type cax21 --image ubuntu-24.04 \
  --ssh-key <your-key> --user-data-from-file cloud-init.yaml
```

**Do not open port 22 to the world.** Install Tailscale in cloud-init and firewall
SSH to the tailnet (§7.4).

### 6.3 Provision (identical for both)

Reference implementation for `tooling/provision/provision.sh` — idempotent,
re-runnable, verified at each step:

```sh
#!/usr/bin/env bash
set -euo pipefail
# Takes a bare Ubuntu 24.04 host to a working factory host.
# Re-runnable. Run as the 'factory' user with sudo rights.

FACTORY_USER=factory
FACTORY_HOME=/srv/factory
STATE_DIR=/srv/factory-state

# 1. Base packages
sudo apt-get update
sudo apt-get install -y curl git jq build-essential ca-certificates nftables \
                        ripgrep unzip

# 2. Node 22 LTS
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node --version   # verify: v22.x

# 3. GitHub CLI + EAS CLI
type gh >/dev/null || { curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg; \
  echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list; \
  sudo apt-get update && sudo apt-get install -y gh; }
sudo npm install -g eas-cli

# 4. Directories
sudo install -d -o "$FACTORY_USER" -g "$FACTORY_USER" -m 0750 "$FACTORY_HOME" "$STATE_DIR"

# 5. Repos (deploy keys already in ~/.ssh/config — see §7.1)
for repo in app-factory running-with-pace skip-hero; do
  [ -d "$FACTORY_HOME/$repo/.git" ] \
    || git clone "git@github.com-$repo:<org>/$repo.git" "$FACTORY_HOME/$repo"
done

# 6. OpenClaw
command -v openclaw >/dev/null || curl -fsSL https://openclaw.ai/install.sh | bash

# 7. Secrets: injected to /run/secrets, root-owned, systemd reads them.
#    NOT in the repo, NOT in the agent's workspace. See §7.2.
sudo install -d -o root -g root -m 0700 /run/secrets
# (operator places factory.env here out-of-band; provisioning does not print it)
sudo chmod 0600 /run/secrets/factory.env

# 8. Gateway as a systemd --user unit so it survives reboot without a login shell
sudo loginctl enable-linger "$FACTORY_USER"
# unit file: tooling/provision/openclaw-gateway.service  (see below)
systemctl --user daemon-reload
systemctl --user enable --now openclaw-gateway

# 9. Factory automations (crons) + watchdog — the existing scripts, unchanged
#    except the watchdog's launchd plist becomes a systemd timer (see §8).
"$FACTORY_HOME/app-factory/openclaw/setup-automations.sh"

# 10. Egress allowlist — LAST, so provisioning itself isn't blocked
sudo "$FACTORY_HOME/app-factory/tooling/provision/egress-allowlist.sh"

echo "Provisioned. Verify: openclaw status && openclaw cron list"
```

`openclaw-gateway.service` (systemd `--user`):

```ini
[Unit]
Description=OpenClaw gateway (App Factory)
After=network-online.target

[Service]
Type=simple
EnvironmentFile=/run/secrets/factory.env
ExecStart=/usr/bin/env openclaw gateway start --foreground
Restart=always
RestartSec=5
# Hardening — the gateway does not need these:
NoNewPrivileges=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true

[Install]
WantedBy=default.target
```

### 6.4 Verification (definition of done)

Provisioning is not complete until all of these pass:

1. `openclaw status` → gateway online.
2. `openclaw cron list` → 4 factory crons + watchdog registered.
3. Watchdog posts to `#factory-watchdog`.
4. A message in `#factory-builds` gets a reply (Slack path end-to-end).
5. `orchestration/bin/factory-run selftest` → green.
6. A quickfire run on a `factory:<app>` rig completes end-to-end.
7. Reboot the VM; confirm 1–4 still hold with no manual intervention.
8. Egress: `curl https://example.com` **fails**; `curl https://api.anthropic.com`
   succeeds.

## 7. Security controls

Ordered by value per unit of effort. Items marked **[do now]** are worth doing on
the current host regardless of whether the VM migration is approved.

### 7.1 Git access — the highest-leverage control

- **Per-repo deploy keys**, not an account-wide SSH key. One key per rig, mapped
  via `~/.ssh/config` host aliases (`github.com-skip-hero` etc.). Read-only where
  the rig never merges; write only where it does.
- **No classic PATs.** For API work use a fine-grained PAT or GitHub App scoped to
  named repos with named permissions. A classic PAT is account-wide and defeats
  the point.
- **Branch protection on `main` for every rig** — require PR, block force-push,
  block branch deletion, no bypass for the agent identity. **[do now]** This is
  what makes a bad run recoverable, and it costs nothing. It also matches how the
  engine already works: runs land on `factory/<id>` branches and wait for review.
- Keys live only on the factory host, passphrase-less is acceptable there because
  the disk is the boundary — so **encrypt the disk** (local: FileVault on the host
  + VM disk; remote: provider-side encryption at minimum).

### 7.2 Secrets

- **Out of the agent's read path.** `openclaw/secrets.env` currently sits inside a
  repo the agent has full read access to — it is correctly gitignored (verified),
  so it is not in git history, but any agent step can `cat` it. Move it to
  `/run/secrets/factory.env`, root-owned `0600`, injected into the gateway via
  systemd `EnvironmentFile`. The agent inherits only what it needs; it cannot read
  the file.
- **Tighten permissions in the meantime.** **[do now]** The file is currently
  `0644` (world-readable). `chmod 600` costs nothing.
- **Separate identities.** The factory gets its own Slack bot token, its own EAS
  token, its own GitHub identity — so revoking the agent never means rotating the
  founder's credentials.
- **Rotation runbook:** every secret should have a documented "how do I revoke and
  reissue this in 5 minutes" line. Write it once, while calm.

### 7.3 Egress allowlist

Only practical because we are in a VM, and the strongest single anti-exfiltration
control available. Prompt injection cannot ship your source anywhere if the socket
will not open.

Default-deny outbound, allow: `api.anthropic.com`, `slack.com` +
`*.slack.com`, `github.com` + `codeload.github.com`, `registry.npmjs.org`,
`api.expo.dev` + EAS endpoints, `api.groq.com` (voice), plus DNS and NTP.

Caveats to be honest about: DNS-name-based nftables rules resolve at load time, so
CDN-backed hosts need periodic re-resolution or an explicit proxy. The robust
version is an egress HTTP proxy with a domain allowlist (squid or tinyproxy) and
`HTTPS_PROXY` set for the agent. Start with nftables, upgrade to a proxy if the
allowlist churns. **Log all denied connections** — that log is the tripwire that
tells you an injection attempt happened.

### 7.4 Host access

- SSH over **Tailscale only**; no public `:22`. If the provider requires a public
  IP, firewall SSH to the tailnet and disable password auth.
- The **gateway must never be publicly bound.** It is local-only today; keep it
  that way. If remote access to `factory-web` is wanted, put it behind Tailscale,
  not a public port with a token.

### 7.5 Operational

- **Snapshot before autonomous runs.** Rollback beats prevention. Local VM
  snapshots are instant; Hetzner snapshots are cheap.
- **Keep approvals on** for elevated commands inside the VM (§2).
- **Ship logs off-box** — command history and egress denials to somewhere the
  guest cannot rewrite, so a compromised host cannot scrub its trail.
- **Unattended-upgrades** for security patches; the box should not rot.
- **Nightly encrypted backup** of `/srv/factory-state` (§5), with a restore drill.

### 7.6 The residual risk (T1) — process, not infrastructure

None of the above stops injected instructions from causing a legitimate-looking
bad action: a PR that quietly weakens a check, a secret echoed into a build log, a
dependency added that shouldn't be. The controls that actually bite here:

- **Human review on anything merging to `main`.** Treat agent-authored PRs with
  the scepticism you'd give a stranger's. The existing three approval gates
  (spec / store submission / marketing calendar) are the right shape — this adds
  merge to the list.
- **Deterministic checks the agent cannot edit in the same PR** — a change to
  `rigs.json` checks or CI config in a feature PR should be a review stop.
- **Treat all fetched content as data, never instructions.** Applies to web pages,
  issue bodies, PR descriptions, dependency READMEs, and Slack messages from
  non-founder accounts.
- **Secret scanning** on push, so an accidental leak is caught at the boundary.

## 8. Migration plan

Phased so the factory is never down and nothing is a one-way door.

| Stage | Work | Rollback |
|---|---|---|
| 0 | **[do now]** `chmod 600` secrets; branch protection on all rig `main`s | Trivial |
| 1 | Write `tooling/provision/` scripts; stand up a **local** VM; provision; run verification §6.4 | Delete VM |
| 2 | Run in **shadow** — factory host live, crons disabled, manual runs only; compare against the Mac host for a few days | Delete VM |
| 3 | Cut over: disable crons + watchdog on the Mac, enable on the VM, move the Slack socket connection. Founder confirms standup fires. | Re-enable on Mac (keep it installed for two weeks) |
| 4 | Add egress allowlist; re-run §6.4 | Flush nftables ruleset |
| 5 | Decide local-vs-rented (§9 Q1). If rented: provision remote with the same script, restore state, repeat stage 3. | Keep local VM |

**Known porting work** (things that are macOS-specific today):

- `openclaw/setup-watchdog.sh` installs a **launchd LaunchAgent**. Needs a systemd
  timer equivalent. The design rationale holds — the watchdog must not be
  scheduled by the process it watches — so a systemd timer, not an openclaw cron.
- Anthropic auth via macOS Keychain → API key or injected credentials file (§6.0).
- `openclaw onboard --install-daemon` assumes LaunchAgent; on Linux this is the
  systemd `--user` unit in §6.3 with lingering enabled.
- README "Getting online" assumes macOS throughout; it needs a Linux column or a
  pointer to this document.

## 9. Open questions for the founder (standup 2026-08-05)

**Q1 — Local VM or rented remote?**
*Local:* free, no third party in the trust boundary, snapshots instant. But the
Mac must be awake for crons to fire — the exact problem D12 flagged and Phase 3
promised to fix.
*Rented (~€9–15/mo Hetzner):* genuinely always-on, laptop can close, survives
reboots and travel. Adds a provider to the trust boundary and a monthly cost.
*Recommendation:* **rented**, because "cron-driven standups must not miss" is the
stated Phase 3 exit condition and a sleeping laptop defeats it. Do stage 1–2 on a
local VM first to get the scripts right, then re-provision remotely — the scripts
are identical, so this costs nothing extra.

**Q2 — Do we do this now, or after app #1 ships?**
Doing it now costs perhaps a day and slows app #1. Doing it later means more
autonomous runs against an unisolated host. *Recommendation:* stage 0 today (an
hour, no disruption), stages 1–3 when app #1 is through its store gate.

**Q3 — Anthropic auth on Linux:** API key (simple, metered separately, easy to
revoke) vs copying subscription credentials (cheaper, more fragile, unclear ToS
footing on a server). *Recommendation:* API key for the factory host.

**Q4 — Is the founder comfortable with a hard rule that the agent identity cannot
merge to `main` unreviewed?** This is the single most effective control against
T1, and it is a workflow constraint as much as a security one.

## 10. What this document does not cover

- Per-rig CI on GitHub Actions (currently checks run on the factory host).
- The Phase 3 Slack Bolt service (D10) — it will need its own host story; the
  same VM is the obvious home.
- Multi-host scale-out (Phase 4, "cloud agents if the box saturates").
- Incident response beyond "snapshot, rollback, rotate".

## 11. Related

- `docs/07-roadmap.md` Phase 3 — "Migrate OpenClaw + services from home machine to VPS"
- `docs/process/decision-log.md` D12 — factory runs on the founder's home machine
- `docs/08-orchestration-layer.md` — the run engine this host must support
- `README.md` "Getting online" — the current macOS bring-up this replaces
