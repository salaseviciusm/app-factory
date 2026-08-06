# Factory State

> Maintained by the chief of staff. Humans may edit; agents must keep it truthful.
> This file is narrative (phase, active apps, yesterday/today plans) and stays
> hand-written. Run and gate status is engine-owned: `factory-run status` (or
> `status --json`) is the authority on in-flight runs, pending gates, and costs —
> the "Awaiting founder" / "In-flight" sections below are narrative context only,
> not authoritative run/gate state.
> Last updated: 2026-08-05 18:00 (EOD sync — every in-flight item reconciled against
> `factory-run list`, git log and branch state; stale entries corrected below)

## Orchestration layer (new 2026-08-03)

Vertical slice of `docs/08-orchestration-layer.md` implemented and live:

- **Engine** `orchestration/bin/factory-run` (selftest green): worktree-per-run,
  Claude Code agent steps, plan gate, deterministic checks + cross-model review
  loop, EAS preview deploy, Slack notify with QR (`openclaw message send`).
- **Rigs** (`orchestration/rigs.json`): running-with-pace + skip-hero (production
  tier, full validation), `factory:<app>` (quickfire tier).
- **Workflows**: feature-dev, bug-fix (executable); new-app (delegates to
  factory-new-app skill).
- **Skill** `factory-feature` loaded in the workspace — founder can start/steer/
  approve runs from Slack, typed or voice.
- **Voice**: OpenClaw transcribes Slack voice notes natively; needs GROQ_API_KEY
  or OPENAI_API_KEY in secrets.env + `openclaw/apply-voice.sh` (PENDING founder key).
- **Smoke run** feature-msdn5cuj (skip-hero, version-label feature) **DONE end-to-end**
  2026-08-03 20:57: plan 1m → founder gate → implement 1.5m (1 clean commit, honored
  CLAUDE.md vendor isolation) → checks green → sonnet review PASS (criteria-by-criteria
  evidence) → tests green → EAS preview update published → link + QR in #factory-builds.
  Branch `factory/feature-msdn5cuj` kept unmerged for founder verification.
  Two engine bugs found+fixed live: `message send --target` flag; eas-cli non-interactive
  needs `--environment` and URL comes from `update:list`, not publish output.
- **Awaiting founder for voice test:** GROQ_API_KEY (or OPENAI_API_KEY) in
  `openclaw/secrets.env`, then `openclaw/apply-voice.sh`.
- **Self-evaluation loop live (2026-08-03 21:15, D19):** SQLite telemetry
  (`orchestration/telemetry.db`) records commits/verdicts/findings/durations per run;
  `factory-run report` digests it. `self-review` workflow: analyze → Slack plan gate →
  spawns feature-dev on the new `app-factory` rig → harness-merge deploy (merge to main
  + gateway restart). Weekly cron Sundays 17:00 + `factory-self-review` skill. First
  self-review run `self-msdnt0sq` started; plan lands in #factory-builds for founder gate.
  NOTE: the spawned implementation runs need app-factory main committed — today's
  orchestration work is uncommitted, so approve the first self-review only after a
  commit pass.

## In flight

**Verified 2026-08-05 18:00 against `factory-run list` + git. No run is executing and
no gate is open.** Two runs sit in `failed` and are the only real in-flight work:

- **`feature-part-c-repoint-daily`** (app-factory) — **failed at deploy 07:32 UTC**,
  step 6/8. Founder approved the plan 08:20 local; implement → checks → review →
  tests all passed (two implement passes). Engine reason: `harness merge failed
  (aborted cleanly): Merge with strategy ort failed`. Work is safe on branch
  `factory/feature-part-c-repoint-daily` — 2 commits ahead of main (`e6b78e4`
  machine-readable `currentStep`/gate kind in `status --json`; `f9b44f8` standup
  sources run/gate/cost facts from factory-run, STATE.md narrative only, D23).
  **Unblock = commit pass on main's dirty prose files, then re-run deploy** (main
  is still dirty at EOD — see Housekeeping).
- **`feature-msdpir37`** (skip-hero) — failed at implement 2/8 since 2026-08-03,
  untouched for two days. $31.70 spent, 4 agent steps. Either retry with a scoped
  prompt or kill it; leaving it is the third day of drift.

Resolved since the last update (previously listed here as in flight):
`feature-deploy-step-recover-merge` **completed** end-to-end and merged
(`0a4706b` + `735dd2d`) — the drift-recovery rebase loop is live, not pending.
`feature-improvement-plan-context` still reads `failed` in the engine but its work
**did** land on main (`d0a7b77`, `131555b`) via hand-merge — engine state is stale
for that run, treat main as truth.

Open follow-up (unowned): serialize runs targeting the app-factory rig — the drift
fix handles conflicts but does not stop concurrent harness runs colliding.

## Phase

**Phase 0 — Foundation, bring-up nearly complete.** OpenClaw 2026.7.1-2 onboarded
(Claude Max via `anthropic-cli`; model `anthropic/claude-opus-4-8`); gateway as
LaunchAgent on 127.0.0.1:18789; workspace verified (agent answers as Chief of Staff,
5 factory skills). Slack connected: `@openclaw/slack` plugin installed, socket mode
connected, 3 channels + founder allowlisted, command owner set, tokens in service
env. Crons registered (standup 08:00 / cutoff 11:00 isolated+announce delivery;
EOD 18:00 main-session system event). First live standup posted 13:12 and a duplicate
re-fire correctly self-suppressed (NO_REPLY). Runbook corrected against reality
throughout (D14 + README fixes).
Next milestone: **factory fully online** (founder confirmed standup visible in Slack
13:20). Awaiting: app #1 idea + O2 analytics decision (both asked in the standup).

## Active apps

- **skip-hero** — **PRIORITY APP (founder steer, 2026-08-06, D26).** Takes all product
  capacity. Registered rig in `orchestration/rigs.json` with a production deploy path.
  Carry-over: `feature-msdpir37` has been failed at implement 2/8 since 2026-08-03
  ($31.70 sunk) — resolve or kill it rather than leaving it failed.

- **pullup** — **BACKLOGGED (founder steer, 2026-08-06, D26).** Sidelined entirely,
  not killed: its spec gate is withdrawn rather than pending. Stages 1–2 + 2D & 3D
  feasibility spikes are on disk as a resumable evidence pack. Spark: record pullups,
  score ROM + form via Apple Vision poses. iOS-native (`VNDetectHumanBodyPoseRequest`;
  3D `…Pose3DRequest` for angle tolerance). Product-lead verdict was
  **BUILD-WITH-CHANGES**. Artifacts in `apps/pullup/`: spec.md, market-notes.md,
  decisions.md, spikes/. Do NOT schedule pullup work, re-open its spec gate, or list
  it as awaiting-founder until the founder explicitly reverses D26.

## Today

**2026-08-05 08:00 — Daily standup posted to `#factory-standup`.** Yesterday was the
biggest engineering day so far and all of it was harness: 17 runs on the `app-factory`
rig, 15 merged to main, $157.96 spent. Landed: web console + Usage page, per-step
transcript capture (`factory-run context`), per-step agent profiles, native new-app
workflow with a conversational `discussion` step, deploy-drift rebase recovery,
branch/worktree reclamation, Slack watchdogs and per-rig notification routing.
One deploy failure (`feature-improvement-plan-context`, quoting bug) was fixed and
hand-merged the same night; `feature-msdpir37` (skip-hero) is still failed from
2026-08-03 and untouched. Zero product work in two days — that is the standup's
headline ask. Pending gate: `feature-part-c-repoint-daily` plan, awaiting approval
since 06:58. Posted proposal: (1) approve/reject Part C and let it run; (2) retry the
skip-hero badge run with a scoped prompt; (3) freeze further harness self-improvement
and spend the day on product — un-pause pullup at the spec gate or take a new app #1.
Founder asks: harness freeze [rec yes]; deployment = rented Linux VM after app #1 +
branch protection on main now [rec]; pullup un-pause [rec]. Reply-watch until 11:00;
no reply → proceed on the posted proposal.
**08:20 — founder replied "1. Approve":** `feature-part-c-repoint-daily` plan gate
approved, run moved to `implement` at 07:20 UTC.

**08:32 — Part C FAILED at deploy (merge-out), work not lost.** Implement + checks +
review + tests all completed; `git merge --no-ff factory/feature-part-c-repoint-daily`
into main aborted because main had **uncommitted local changes to `STATE.md` and
`docs/process/decision-log.md`** — the long-standing git-hygiene debt finally bit a run.
(EOD check: engine records the reason as `harness merge failed (aborted cleanly):
Merge with strategy ort failed` at 07:32:36 UTC — consistent with a dirty base; the
merge aborted with no partial state. Still `failed` at 18:00, branch still unmerged,
main still dirty, so the unblock is unchanged.)
Branch `factory/feature-part-c-repoint-daily` holds the work. Fix = commit-pass on the
dirty files, then re-run deploy. Distinct from yesterday's drift bug (that was *other
runs* landing on main; this is *our own* untracked prose). Follow-up for the harness:
the deploy step should refuse to start, or auto-stash, when the base worktree is dirty.

**08:34 — founder redirected the day: marketing research.** Superseded standup items 2
and 3 without answering them directly. Ask: how to market the factory's apps as
hands-off as possible — founder supplies raw demo recordings, agents turn them into
content. Research scope: (a) which platforms are available, organic and paid; (b) which
actually work, evidenced by real case studies dissected per platform, with each
platform's *algorithm mechanism* documented as its own reusable reference; (c) a design
for a hands-off pipeline where marketing suggests video ideas, the founder records, and
an automated pipeline edits and publishes. Extended at 10:06 with: apps that **failed**
and why; **bootstrapped** app case studies (no VC money, natural-not-paid content) as
the closest baseline to us; and **which audiences/niches concentrate on which platform**
so each app targets where its users actually live. Founder also flagged this should
become a reusable factory **workflow template**, not a one-off.

Structured as three waves in `docs/marketing/` (see its README for the layout).
**Wave 1 DONE 10:32** — five platform bundles, ~24 files, `algorithm.md` /
`audience.md` / `case-studies.md` / `credibility.md` each for TikTok, Instagram,
YouTube, communities (Reddit/HN/PH/IH), X+LinkedIn, plus a paid bundle
(landscape / aso / case-studies / triggers). Claims tagged `[DOCUMENTED]` vs
`[ANECDOTAL]`. **Wave 2 dispatched 11:00** (it had stalled after Wave 1 — the founder's
10:16 status question went unanswered until the cutoff): `failures/` (post-mortems,
reusable failure taxonomy, bootstrapped baseline with survivorship bias called out) and
`pipeline/` (tooling survey, end-to-end design fitted to `factory-run`, feedback loop,
ToS/ban risk). **Waves 2 ✅ and 3 ✅ both landed — verified on disk at EOD:**
`failures/` (3 files), `pipeline/` (4 files), `synthesis/` (4 files) —
`ranking.md` (#1 IG Reels + YT Shorts, #2 TikTok, #3 YT long-form + third-party
reviews; explicit don't-bother-yet tier; the App Store listing is rank 0),
`platform-selection.md` (six-question decision procedure, worked examples for
pullup / running-with-pace / skip-hero), `playbook.md` (weekly rhythm, ~40 min of
founder recording, gates that unlock paid, kill/pivot triggers), `open-questions.md`
(the four experiments that would settle what research can't). ~35 files, **all still
untracked in git** — the whole day's output exists only in the working tree.
Still outstanding from the founder's ask: turning this into a reusable factory
**workflow template** (the `playbook.md` is the operating rhythm, not yet a
`factory-run` workflow).

**Standing (unanswered, now moot-by-action):** the harness freeze the standup
recommended is in effect de facto — the day went to marketing research, not to the
factory improving the factory. `feature-msdpir37` (skip-hero badge) remains failed and
untouched since 2026-08-03.

**18:00 — EOD sync (chief of staff).** Reconciled every in-flight claim in this file
and `apps/pullup/STATUS.md` against `factory-run list`, `git log`, branch state and
run event logs. Corrections applied: the `feature-deploy-step-recover-merge` entry
was stale (that run finished and merged on 08-04, not awaiting a gate); the
housekeeping list was stale (`apps/pullup/`, `tooling/` are tracked now, while
today's ~35 marketing files and `docs/09-deployment-and-security.md` are not); the
pullup spec gate was still listed as an open founder gate despite the 08-03 hold;
Waves 2 and 3 of the marketing research are both complete on disk. State of play at
close: **zero runs executing, zero gates open, two failed runs, one dirty main.**

**Needs founder attention tomorrow (in order):**

1. **Commit pass on app-factory main.** Blocks Part C's re-deploy and every future
   harness-merge run. ~35 untracked marketing files + `docs/09` + 3 modified files.
   Cheapest fix, unblocks the most.
2. **Part C:** after the commit pass, re-run deploy on
   `factory/feature-part-c-repoint-daily` — the work is done and reviewed, only the
   merge failed.
3. **`feature-msdpir37` (skip-hero):** three days failed and untouched, $31.70 sunk.
   Retry with a scoped prompt or kill it — but decide.
4. **Product direction is still the real gap.** Three days, zero product work: pullup
   is paused, no app #1 replacement chosen. The marketing research now exists to
   support whichever app ships; nothing ships without this call.
5. **Marketing workflow template** — the founder asked for a reusable factory
   workflow, not just research. `synthesis/playbook.md` is the operating rhythm;
   turning it into an executable `factory-run` workflow is unstarted and unassigned.
6. Still open from 08-05 morning, never answered: branch protection on `main`
   (recommended, external change to the GitHub repos) and local-vs-rented VM timing.

**2026-08-03 08:41 — Daily standup posted to `#factory-standup`.** Phase 0; pullup at
the spec gate, blocked on founder. No engineering to allocate until the gate opens.
Posted proposal: (1) chief-of-staff commit pass to land uncommitted app work per D3
(code+docs tracked; ~8MB stock `.mp4`s gitignored unless founder wants them in); (2) on
spec approval → kick off Stage 3–4 (brand + design) via product-lead and have tech-lead
formalize architecture.md off the §2.5/§5 seeds. Founder asks: spec-gate approval +
3 decision-shaped Qs (scope: widen to pull-ups+dips+push-ups on one pipeline [rec];
monetization: annual-forward sub $19.99 [rec] vs one-time unlock; commit-pass nod).
**Update since EOD:** spike 002 (3D `VNDetectHumanBodyPose3DRequest`) landed ~20:27 and
VALIDATED the founder's own from-behind/worm's-eye footage — face-independent chin-over-bar
(`head.y` vs `wrist.y`) + 3D elbow angle usable in 76–87% of frames where 2D's nose died at
3.6%. **The "send a clean front/¾ clip" ask is now nice-to-have, not a gate.** Reply-watch
until 11:00; no reply → proceed on posted proposal.

**2026-08-02 13:12 — First live standup posted to `#factory-standup`**
(msg `1785672736.968909`, deliveryStatus: sent — outbound Slack now verified end-to-end).
No engineering to allocate: Phase 0, no app chosen. Plan holds until founder steers:
on app #1 selection → kick off Stage 1 refinement via product-lead (DoD: one-page brief
for spec gate). Awaiting founder on: app #1 idea, analytics provider (default PostHog),
channel-invite/react confirmation. Standup fired late (13:09, not 08:00) so the 11:00
reply-cutoff is moot — proceeding on the posted proposal.

**2026-08-02 13:18 — Duplicate standup trigger suppressed.** The standup cron
re-fired 6 min after the 13:12 post; nothing changed (still Phase 0, no apps, nothing
to allocate). Did not double-post to avoid channel noise. Today's standup stands as the
13:12 message.

**2026-08-02 ~13:58 — pullup product-lead delivered stages 1–2.** Refinement + market
check written to `apps/pullup/spec.md` + `market-notes.md`. Verdict: **BUILD-WITH-CHANGES**,
gated on a pose-feasibility spike. Sharp open questions returned for the founder spec gate.

**2026-08-02 14:14 — Founder approved feasibility spike; ~14:22 delivered (stock).**
Real on-device Apple Vision run over real pull-up footage. Result: **VALIDATED / go** —
`VNDetectHumanBodyPoseRequest` tracks pull-ups through full ROM incl. the occluded top
(wrist conf ~0.8+); no ARKit/Create ML needed for v1. Production notes: build rep/ROM on
**elbow angle** (nose flickers at the top), **ignore hips**, add an in-app framing guide.

**2026-08-02 17:34–17:48 — Spike re-run on founder's own footage.** Founder sent two
garden clips: clip 1 = pushups filmed worm's-eye (phone flat on ground); clip 2 = pull-ups
filmed **from behind** (face away → nose-based chin-over-bar impossible). Neither is a clean
front/¾ pull-up, so they don't validate the mechanic on his setup — but they surface a
real-world capture constraint. **Verdict downgraded to PARTIAL for "impromptu" capture:**
core mechanic still VALIDATED on well-framed pull-ups; a **capture UX (upright phone, front/¾,
face+body+bar in frame) + live confidence/orientation gate is now a first-class v1 requirement**,
not a nice-to-have. Still need ONE clean front/¾ clip (face visible) to close end-to-end
validation on the founder's conditions. Note: `IMG_0451.MOV` (one originally-sent file) never
resolved to disk — re-share if intended.

## Awaiting founder

- Invite the bot (`/invite @OpenClaw`) into `#factory-standup`, `#factory-approvals`, `#factory-builds` — then say so and the outbound smoke test + a live standup run finish verification
- ~~DM the bot `status` in Slack for the conversational-loop check~~ ✅ done 2026-08-02 13:48 (founder DM'd `status`; reply delivered)
- ~~O2: analytics provider~~ ✅ resolved 2026-08-02 → D16 (PostHog, factory-wide)
- ~~Pick the idea for app #1~~ ✅ resolved 2026-08-02 → **pullup** (see Active apps)
- ~~**Next gate (open):** spec approval for pullup~~ — **superseded 2026-08-03 09:20:
  the founder paused pullup at this gate.** The questions in `apps/pullup/spec.md` are
  parked, not pending; nothing to answer until he un-pauses the app.
- **Founder ask (parked with pullup):** send ONE clean front/¾ pull-up clip (phone upright, face + full
  body + bar in frame) so the spike can close end-to-end validation on the founder's own
  conditions. The two clips sent 2026-08-02 were pushups (worm's-eye) and pull-ups-from-behind
  — neither validates the pull-up mechanic on his setup. Optionally re-share `IMG_0451.MOV`
  (never resolved to disk).
- **Heads-up (not a gate):** the spike downgraded real-world capture to PARTIAL — v1 must
  ship a capture guide + confidence/orientation gate. Fold into the spec before build.

## In-flight

_No active subagents._ Both of today's runs delivered:

- ~~**pullup product-lead (stages 1–2)** — run `ce6e55c4-…`~~ ✅ delivered ~13:58.
  spec.md + market-notes.md written; verdict BUILD-WITH-CHANGES.
- ~~**pullup pose-feasibility spike** — run `7e580994-…`~~ ✅ delivered. Stock verdict
  VALIDATED/go (~14:22); founder-footage re-run PARTIAL for impromptu capture (~17:48).
  Artifacts in `apps/pullup/spikes/001-pose-feasibility/` (+ `founder/`).

**Paused, awaiting founder input:** end-to-end validation on the founder's own conditions
is blocked on him sending one clean front/¾ pull-up clip (see Awaiting founder).

## Deployment & security (new 2026-08-05, awaiting founder)

Founder asked whether the factory should run isolated (Docker → VM) and how to make
it as safe as possible. Written up as `docs/09-deployment-and-security.md`: threat
model, portable Linux-VM architecture, provisioning runbook (local **or** rented,
same script), security controls, phased migration.

- **Key finding:** the factory does **not** need macOS. All rigs deploy via
  `eas-update` and EAS builds run in Expo's cloud; `planex-quoter`/`fin-news` are
  plain Node. So: Linux guest, ~€9–15/mo rented (vs €80–200 for anything Mac).
- **Key caveat:** the top threat (prompt injection misusing granted access) is *not*
  solved by isolation. Needs scoped tokens, egress allowlist, branch protection and
  human review on merge — documented as a separate control layer.
- **Done immediately:** `openclaw/secrets.env` was `0644` (world-readable, though
  correctly gitignored) → now `0600`.
- **Recommended next, NOT done — needs founder nod:** branch protection on `main`
  for every rig (external change to GitHub repos).
- **Open questions for standup:** local vs rented; now vs after app #1 ships;
  Anthropic auth on Linux (API key vs subscription creds); whether the agent
  identity is barred from unreviewed merges to `main`.
- No decision-log entry yet — nothing has been decided.

## Housekeeping (git hygiene)

**Re-verified 2026-08-05 18:00 (`git status`).** The old entry here was stale:
`apps/pullup/` and `tooling/` **are now tracked** (landed 2026-08-04 as `1e98a1d`).

What is actually dirty on `app-factory` main right now:

- Modified: `STATE.md`, `docs/07-roadmap.md`, `docs/process/decision-log.md`
- Untracked: `docs/09-deployment-and-security.md`, `docs/marketing/` (~35 files —
  the entire day's research output)

This is no longer only hygiene: **it is what blocks `feature-part-c-repoint-daily`
from re-deploying**, and any harness-merge run started tomorrow will hit the same wall.
A commit pass on these files is the single highest-leverage first action tomorrow.

Also loose, lower priority:

- Merged-but-undeleted branches on app-factory: `factory/bug-merged-run-branches`,
  `factory/feature-improvement-plan-context` — ironic, given the first one *is* the
  branch-reclamation fix. Reclamation appears not to clean its own branch.
- `skip-hero`: `marketing/` (5 files: strategy, brand-direction, content-calendar,
  content-samples, naming-aso) is untracked in that repo, and branches
  `factory/feature-msdn5cuj` (the verified smoke run) + `factory/feature-msdpir37`
  (the failed badge run) are both still unmerged.
