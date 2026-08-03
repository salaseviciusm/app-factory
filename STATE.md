# Factory State

> Maintained by the chief of staff. Humans may edit; agents must keep it truthful.
> Last updated: 2026-08-03 20:50 (orchestration layer built: run engine + rigs +
> factory-feature skill live; end-to-end smoke run in flight on skip-hero)

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

- **pullup** — **ON HOLD (founder paused at spec gate, 2026-08-03 09:20).** Paused, not
  killed: Stages 1–2 + 2D & 3D feasibility spikes all delivered and on disk as a resumable
  evidence pack. Spark: record pullups, score ROM + form via Apple Vision poses. iOS-native
  (`VNDetectHumanBodyPoseRequest`; 3D `…Pose3DRequest` for angle tolerance). Product-lead
  verdict was **BUILD-WITH-CHANGES**. Artifacts in `apps/pullup/`: spec.md, market-notes.md,
  decisions.md, spikes/. Do NOT resume Stage 3+ until the founder un-pauses.

## Today

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
- **Next gate (open):** spec approval for pullup — product-lead's stage-1/2 open questions
  are in `apps/pullup/spec.md`, waiting on the founder. Lands at tomorrow's 08:00 standup.
- **Founder ask (open):** send ONE clean front/¾ pull-up clip (phone upright, face + full
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

## Housekeeping (git hygiene)

Today's app work is on disk but **not yet committed**: `apps/pullup/` and `tooling/` are
untracked; `STATE.md` and `docs/process/decision-log.md` (D16) have uncommitted edits. Per
D3 (files over chat memory) these should land in git. Not auto-committing binary blobs
(stock `.mp4`s, ~8MB) + this state churn without a founder nod — flagging for a commit pass.
