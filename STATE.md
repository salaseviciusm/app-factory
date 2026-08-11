# Factory State

> Maintained by the chief of staff. Humans may edit; agents must keep it truthful.
> This file is narrative (phase, active apps, yesterday/today plans) and stays
> hand-written. Run and gate status is engine-owned: `factory-run status` (or
> `status --json`) is the authority on in-flight runs, pending gates, and costs —
> the "Awaiting founder" / "In-flight" sections below are narrative context only,
> not authoritative run/gate state.
> Last updated: 2026-08-10 21:31 (EOD sync — host was asleep 07:25–21:26, so the day
> was dark; in-flight items re-reconciled against GitHub PR state rather than the
> engine, which was found stale on 4 of 6 `awaiting-merge` entries. Corrections in the
> 2026-08-10 block at the end of this file.)
>
> Prior: 2026-08-09 18:00 (EOD sync — every in-flight item reconciled against
> `factory-run list`/`status --json`, per-run engine.logs, `git log` /
> `branch -vv` / `worktree list` / `merge-base` in all three rigs, the GitHub PR
> list per rig, and the `subagent_runs` table; corrections in the 2026-08-09 EOD
> block at the end of this file. Note: 2026-08-08 was a zero-activity day
> factory-wide, so the 08-07 blocks below cover two elapsed days.)

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

**Verified 2026-08-06 18:00 against `factory-run list`, `status --json` histories,
`orchestration/telemetry.db`, git log/branch state and the OpenClaw `subagent_runs`
table. Zero runs executing, zero gates open, one failed run, no active subagents.**

- **`feature-msdpir37`** (skip-hero) — the only in-flight item, and it has not moved
  in three days. `failed` at step 2/11 (`implement`) since **2026-08-03 23:47 UTC**;
  engine reason is now known: **`agent step 'implement' timed out after 90m`** (not a
  code failure — the step never returned). $31.70 spent, 4 agent steps. Its branch
  `factory/feature-msdpir37` is 3 commits ahead of skip-hero main (`e816749` OTA
  update ID in the Settings About footer, `fb8b387` react-hooks lint clean,
  `db22b23` speech adapter survives a missing native module) and its worktree is
  still mounted. The work is *mostly done* — retry from the branch with a scoped
  prompt, or kill it and cherry-pick the two useful commits. Third day of drift, and
  it now sits on the priority app (D27).

**Corrected from the 2026-08-05 EOD entry (both claims were stale within hours):**

- `feature-part-c-repoint-daily` is **`done`, not failed**. It was recovered by hand
  at **2026-08-05 21:25** — after last night's sync — and merged as **`3c736ca`**.
  Engine detail: *"deploy recovered manually: main was dirty at merge time, then
  drifted; merged after conflict resolution in STATE.md + decision-log (D23
  renumbered to D25)"*. The commit pass it was waiting on happened the same night.
- The dirty-main blocker is **gone**. `app-factory` main is clean apart from this
  file. `docs/marketing/` (~35 files), `docs/09-deployment-and-security.md`,
  `docs/07-roadmap.md` and the decision log were all committed on 08-05 evening.

Open follow-up (unowned, carried): serialize runs targeting the app-factory rig — the
drift fix handles conflicts but does not stop concurrent harness runs colliding.
Second follow-up from msdpir37: the 90m agent-step timeout kills a run and leaves no
retry path — the engine should checkpoint or auto-retry a timed-out implement step
rather than terminating the run.

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

- **skip-hero** — **PRIORITY APP (founder steer, 2026-08-06, D27).** Takes all product
  capacity. Registered rig in `orchestration/rigs.json` with a production deploy path.
  Carry-over: `feature-msdpir37` has been failed at implement 2/11 since 2026-08-03
  ($31.70 sunk, 90m step timeout) — resolve or kill it rather than leaving it failed.
  Shipped today: two-preview split, save-video fix, pose stabilizer, share-sheet
  recording export (`4e2a40f`) — all merged to skip-hero main by 09:32.

- **running-with-pace (Pace)** — **ACTIVE (added 2026-08-09 EOD; flagged as missing at
  the 08-07 standup and at the 08-07 EOD and not fixed until now).** Registered rig,
  merge policy `review`. The founder's own product, driven largely by him directly;
  the factory contributes feature/bug runs off `factory/*` branches that land as
  GitHub PRs. **8 engine runs to date, $143.41** (corrected 08-10; the "five runs,
  ~$104" written here on 08-09 undercounted). Four have landed on `main` — PRs
  #40/#41/#42 (squash, 08-09) plus `bug-app-startup-very-slow` (`86ffe89`, 08-07).
  **Only 2 remain open**: PR #45 (`bug-run-progress-does-not`) and
  `feature-two-cold-start-stalls`, which has no PR at all. Working tree may carry
  founder-side edits — do not assume a clean rig when starting runs here.

- **pullup** — **BACKLOGGED (founder steer, 2026-08-06, D27).** Sidelined entirely,
  not killed: its spec gate is withdrawn rather than pending. Stages 1–2 + 2D & 3D
  feasibility spikes are on disk as a resumable evidence pack. Spark: record pullups,
  score ROM + form via Apple Vision poses. iOS-native (`VNDetectHumanBodyPoseRequest`;
  3D `…Pose3DRequest` for angle tolerance). Product-lead verdict was
  **BUILD-WITH-CHANGES**. Artifacts in `apps/pullup/`: spec.md, market-notes.md,
  decisions.md, spikes/. Do NOT schedule pullup work, re-open its spec gate, or list
  it as awaiting-founder until the founder explicitly reverses D27.

## Today

**2026-08-06 11:00 — cutoff: founder replied, day re-planned.** The 08:21 standup
proposal is superseded. Founder's 10:39 redirect: spend the day researching SkipHero's
target audiences, target platforms, and marketing strategy — branding (themes, naming)
is open to change. Cap of 2-3 research agents concurrent, building on yesterday's
documented learnings. Four questions to answer: which audiences to target, which
platforms, what content works per audience, what features each audience wants.

**⚠️ CORRECTED AT EOD — the re-plan was written down but never executed.** This file
claimed at 11:02 that "Wave 1 dispatched 10:42 (audiences / platforms / branding), in
flight at cutoff; outputs to `~/src/skip-hero/marketing/research-2026-08-06/`". That is
**false**. Verified three independent ways at 18:00:

1. `subagent_runs` in `~/.openclaw/state/openclaw.sqlite` — the **last subagent of any
   kind was `marketing_wave3_synthesis`, ended 2026-08-05 12:12**. Nothing was spawned
   on 08-06. Thirteen subagent runs total, none today.
2. `~/src/skip-hero/marketing/research-2026-08-06/` **does not exist**.
3. No file anywhere under `~/src` was written after 09:32 today except `STATE.md`
   itself (11:02), `orchestration/telemetry.db` and `orchestration/web/audit.log`.

So the founder's 10:39 redirect produced a plan and a STATE.md entry and **no work**.
Wave 2 never had a Wave 1 to fire from. **The factory has been idle since 09:32** —
8.5 hours, on the day the founder redirected it.

The 5 files in `~/src/skip-hero/marketing/` (strategy, brand-direction,
content-calendar, content-samples, naming-aso, all 09:30) **predate** the redirect and
are unrelated to it — they are not Wave 1 output. Still untracked in that repo.

Carried and still not done: resolve `feature-msdpir37` (see In flight) and clean its
branch. Dropped: the marketing workflow template (item 4) — the research supersedes it
and should shape it.

Closed before cutoff, nothing in flight on either rig. **Verified against telemetry —
four runs were created on 08-06, all `done`, all merged, last finishing 09:32:**
- `feature-split-preview-into-two` (skip-hero, 07:21→07:44), $9.71 — two-screen preview.
- `bug-save-video-not-working` (skip-hero, 07:22→07:48), $14.09.
  Both landed on main via the founder's own PRs #1/#2 (`af67a05`, `acd0f12`).
- `feature-files-dir-page-orchestration` (app-factory, 08:01→08:32) merged
  (`6c4b1cc` + `b35c228`), $8.29 — files page serving `examples/` and `debug/`.
- `feature-way-get-session-s` (skip-hero, 08:31→09:32) merged to skip-hero main
  (`4e2a40f`), $6.89 — pose recordings exportable via the iOS share sheet (ADR 0021).
- `feature-give-every-rig-explicit` ($87.08, 19 steps) is **an 08-05 run**, not an 08-06
  one — started 21:37 on 08-05, finished 23:43; its merge commit `0cc9807` lands at
  09:08 today, which is what made it look like today's work. Same for `ce530aa` (D27
  docs) and `31a56f2`. Today's genuine new spend is **$38.98** across four runs.
- Pose stabilizer (`e2c310b`) is likewise an 08-05 run merged this morning.

**2026-08-06 18:00 — EOD sync (chief of staff).** Reconciled every in-flight claim in
this file and `apps/pullup/STATUS.md` against `factory-run list` / `status --json`
histories, `orchestration/telemetry.db`, `git log` + branch/worktree state, and the
OpenClaw `subagent_runs` table. Corrections applied:
- **The 11:02 "Wave 1 dispatched" claim was false** — no subagent ran today at all
  (see the ⚠️ block above). This is the serious one: the file asserted work that did
  not exist, which is exactly what this section is supposed to prevent.
- `feature-part-c-repoint-daily` was recorded as `failed`; it is `done` and merged
  (`3c736ca`), recovered by hand at 21:25 on 08-05.
- The "dirty main blocks every harness merge" blocker was recorded as open; it was
  cleared the same night. Main is clean apart from this file.
- Housekeeping listed app-factory branches that no longer exist, and missed the three
  merged-but-unreclaimed skip-hero branches/worktrees that do.
- `feature-msdpir37`'s failure reason is now recorded (90m implement timeout) and its
  step count corrected (2/11, not 2/8).
- Decision references fixed: the skip-hero-priority steer is **D27**, not D26.
- pullup's STATUS.md still described a *hold at the spec gate*; D27 withdrew that gate
  and backlogged the app — corrected there.

State of play at close: **zero runs executing, zero gates open, one failed run
(`feature-msdpir37`), no active subagents, both main branches clean of blockers but
unpushed.**

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

**2026-08-05 18:00 — EOD sync (chief of staff).** _(Historical. Two of its conclusions
were overtaken within four hours — Part C was hand-recovered at 21:25 and the commit
pass landed the same night; see the 08-06 EOD entry.)_ Reconciled every in-flight claim
in this file and `apps/pullup/STATUS.md` against `factory-run list`, `git log`, branch state and
run event logs. Corrections applied: the `feature-deploy-step-recover-merge` entry
was stale (that run finished and merged on 08-04, not awaiting a gate); the
housekeeping list was stale (`apps/pullup/`, `tooling/` are tracked now, while
today's ~35 marketing files and `docs/09-deployment-and-security.md` are not); the
pullup spec gate was still listed as an open founder gate despite the 08-03 hold;
Waves 2 and 3 of the marketing research are both complete on disk. State of play at
close: **zero runs executing, zero gates open, two failed runs, one dirty main.**

**Needs founder attention tomorrow (in order) — refreshed 2026-08-06 18:00:**

1. **The factory stopped working at 09:32 and nobody noticed for eight hours.** The
   10:39 redirect to SkipHero marketing research was planned, written into this file
   as "dispatched", and never actually dispatched — zero subagents ran today. This is
   a reliability failure in the chief-of-staff layer, not a founder decision, but the
   founder should know his redirect produced nothing. **Ask: re-issue the research
   brief tomorrow morning, or is it superseded?** If re-issued it runs first thing.
   Harness follow-up (mine): a dispatch must be verified — write the STATE.md entry
   *after* the spawn returns run ids, never before, and have the heartbeat flag
   "planned work with no corresponding subagent/run" as an alert.
2. **`feature-msdpir37` (skip-hero):** three days failed, $31.70 sunk, now sitting on
   the priority app. Cause is a **90-minute implement-step timeout**, not broken code,
   and its branch already carries three usable commits (OTA update ID in Settings,
   lint clean, speech-adapter guard). Cheapest path: cherry-pick the two safe commits
   and kill the run. **Decide: retry scoped, or kill and cherry-pick [rec].**
3. **Nothing is pushed.** `app-factory` main is **12 commits ahead of origin**;
   `skip-hero` main is **2 ahead**. A full day of merged work exists only on this
   machine — and the 08-05 "push every commit immediately" fix (`db94ccf`) explicitly
   narrowed pushing to run branches, not the base branch. One `git push` per repo
   fixes today; the policy question (should harness merges push main?) is the founder's.
4. **Product direction — still the gap, but narrowing.** D27 made skip-hero the
   priority app and today four skip-hero features shipped, so this is no longer "zero
   product work". What is still missing is a **destination**: no ship date, no v1 scope
   line, no store-submission target for skip-hero. The marketing research exists to
   support a launch that has not been scheduled.
5. **Marketing workflow template** — the founder asked for a reusable factory
   workflow, not just research. `docs/marketing/synthesis/playbook.md` is the operating
   rhythm; turning it into an executable `factory-run` workflow is unstarted and
   unassigned. Third day carried.
6. Still open from 08-05 morning, never answered: branch protection on `main`
   (recommended, external change to the GitHub repos) and local-vs-rented VM timing.
   Note item 3 makes branch protection more relevant, not less.

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
- ~~Pick the idea for app #1~~ ✅ resolved 2026-08-02 → pullup; **superseded 2026-08-06
  by D27 → skip-hero is the priority app**
- ~~**Next gate (open):** spec approval for pullup~~ — **closed. Paused 2026-08-03
  09:20, then withdrawn entirely 2026-08-06 by D27.** The questions in
  `apps/pullup/spec.md` are archived, not pending. Nothing here is awaiting the founder.
- ~~**Founder ask:** send ONE clean front/¾ pull-up clip~~ — **archived with pullup
  (D27).** Only relevant if pullup is restarted. `IMG_0451.MOV` never resolved to disk.
- ~~**Heads-up:** capture-UX/confidence gate is a v1 pullup requirement~~ — archived
  with pullup (D27); fold into the spec if the app is ever restarted.

**Live founder items are the numbered list under "Today", not this section.**

## In-flight (subagents)

_No active subagents — verified 2026-08-06 18:00 against `subagent_runs`._ The last
subagent of any kind ended **2026-08-05 12:12** (`marketing_wave3_synthesis`). Nothing
was spawned on 08-06, which is the day's headline problem — see the ⚠️ block in Today.

Historical, both delivered 2026-08-02 (archived with pullup under D27):

- ~~**pullup product-lead (stages 1–2)** — run `ce6e55c4-…`~~ ✅ delivered ~13:58.
  spec.md + market-notes.md written; verdict BUILD-WITH-CHANGES.
- ~~**pullup pose-feasibility spike** — run `7e580994-…`~~ ✅ delivered. Stock verdict
  VALIDATED/go (~14:22); founder-footage re-run PARTIAL for impromptu capture (~17:48).
  Artifacts in `apps/pullup/spikes/001-pose-feasibility/` (+ `founder/`).

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

**Re-verified 2026-08-06 18:00 (`git status`, `git branch -vv`, `git worktree list`
in both repos).** The 08-05 entry here is fully superseded — the dirty-main blocker it
described was cleared that same evening, and the app-factory branches it listed no
longer exist.

**`app-factory`:**

- Working tree is **clean apart from `STATE.md`** (this sync). `docs/marketing/`
  (~35 files), `docs/09-deployment-and-security.md`, `docs/07-roadmap.md` and the
  decision log were all committed on 08-05 evening. The Part C blocker is gone.
- Local branches: **`main` only.** Every `factory/*` branch has been reclaimed and
  there are no stale worktrees. Branch reclamation is working.
- ⚠️ **`main` is 12 commits ahead of `origin/main` — unpushed.** Everything from
  `c002399` (per-rig merge/deploy policy) through `b35c228` (files page) exists only
  on this machine. This is new debt, not carried, and it is the riskiest item here.

**`skip-hero`:**

- ⚠️ **`main` is 2 commits ahead of `origin/main` — unpushed** (`d55af96`, `4e2a40f`).
- Untracked: `marketing/` (5 files: strategy, brand-direction, content-calendar,
  content-samples, naming-aso, written 08-06 09:30). Modified: `.gitignore` (adds a
  `debug/` ignore for ad-hoc screen recordings — a real change worth committing).
- **Three merged-but-unreclaimed branches, each still holding a worktree** under
  `app-factory/orchestration/worktrees/`: `factory/bug-save-video-not-working`,
  `factory/feature-split-preview-into-two`, `factory/feature-pose-stabilizer-tracking`.
  All three are merged into skip-hero main and safe to delete. **Why reclamation
  missed them:** all three landed via the *founder's* GitHub PR merges or a manual
  merge, not through the engine's deploy step — so the engine never saw the merge and
  never ran cleanup. Worth a harness fix: reclaim on "branch is an ancestor of the base
  branch", not only on "this run merged it".
- `factory/feature-msdpir37` is genuinely unmerged (the failed run) — keep its worktree
  until that run is retried or its commits are cherry-picked.
- `factory/feature-msdn5cuj` (the 08-03 smoke run) has been reclaimed since the last
  entry; its work is on main as `bafb3c0`.

---

## Today — 2026-08-07 (standup posted 08:50)

Engine-verified at 08:45 (`factory-run status --json`, `report --days 2/7`, git log in
all three rigs). Overnight the founder ran a large build session: 15 runs reached a
terminal state since the 08-06 standup, ~$155. **running-with-pace (Pace) is now an
active app taking real capacity** — it is not yet listed under "Active apps" above.

Proposed plan (proceeds at 11:00 absent a founder reply):

1. **Pace — resume `feature-move-territory-calculation` at the deploy step.** Work is
   done and green (4 commits, review + tests passed, failed only at 9/11 on the EAS web
   export). Requires committing the `updatePlatform: "ios"` edit to `rigs.json` first.
   DoD: EAS preview published, run reaches awaiting-merge.
2. **Pace — restart `feature-reduce-event-storage-phone`.** Crashed at plan-discussion
   turn 2 on `process.getpgrp is not a function` (engine bug, not the product); zero
   commits on its branch. DoD: run reaches the plan gate again.
3. **app-factory — fix `factory-run:820` `process.getpgrp`** (Node 26 removed it).
   Two-minute guarded edit, not a run.
4. **skip-hero — the 08-06 marketing research, still outstanding.** Never executed
   (see the 08-06 correction above). Narrow it to one task: run the
   `docs/marketing/synthesis/platform-selection.md` procedure against skip-hero and
   write the answer to `docs/marketing/apps/skip-hero.md`. DoD: audiences, platforms,
   per-audience content, and requested features, each with evidence or an explicit gap.

Awaiting founder (engine-sourced): merge `factory/feature-pace-social-page-signed`;
kill `feature-msdpir37` (superseded — its OTA badge landed as `d166920` via
`feature-retry-failed-run-feature`); yes/no on the dirty-rigs preflight check.

### 11:00 cutoff — founder replied at 09:10, day re-planned. Engine-verified.

Founder's reply (09:10 BST): "3. Do this / 4. Yes please kick this off. Find multiple
possible audiences and angles we could target / Kill the msdpir37 worktree." Acted on
immediately (09:16 and 09:29 in-thread), remainder proceeded on the 11:00 default.

**Done:**
- `feature-msdpir37` **killed**; worktree and branch force-removed, 2.10 GB reclaimed.
  Branch tip preserved as tag `archive/feature-msdpir37` in skip-hero (react-hooks lint
  clean + speech-adapter-survives-missing-native-module; the OTA badge commit is
  superseded by `d166920`). Third-day drift item closed.
- Item 3 — `process.getpgrp` guarded (`db36627`); falls back to `ps -o pgid=` and treats
  an undeterminable pgid as "not the group leader". `selftest` green. The pace rig's
  `updatePlatform: "ios"` was committed in the same commit — that uncommitted edit was
  the $28.82 overnight failure, and it is now actually closed rather than merely known.
- Item 4 — research landed and **committed** (`da3a46b`, `docs/marketing/apps/skip-hero.md`,
  738 lines). Broadened per the founder to multiple audiences and angles: 8 audiences,
  each with its own kill-reason, and 3 ranked audience × angle × platform combos.
  Spot-checked against source: `ad0bd8a` real, no RevenueCat/StoreKit in the repo, App
  Store rating counts re-pulled independently (Crossrope 13,476 / 4.85, Jump Rope Counter
  Pro 11, YaoYao 1,016) — all check out.
  Headline finding: all five camera-based jump-rope counters hold **44 US ratings between
  them** over 3.5 years, against Crossrope's 13,476. Camera counting is not "table stakes";
  it is a table nobody is sitting at. Programming, structure and community are what sell.
  Two consequences: the designated 08-06 hero clip is **unfilmable** (it shows the app
  naming what your feet did, which no user-facing screen does), and Rank 0 is skipped —
  no listing, no paywall, no IAP, so every calendar in that set assumes a launch that
  cannot happen.
- Items 1 and 2 (silent default, started 09:16) both **finished green and are now
  `awaiting-merge`**: `feature-move-territory-calculation` ($28.82) and
  `feature-reduce-event-storage-phone` ($50.52).

**Proceeded on the 11:00 default (unanswered twice):**
- **Dirty-rigs preflight check** → started as `bug-preflight-assertion-fails`
  (app-factory, bug-fix, ~$4 expected). Scoped to `orchestration/rigs.json` only, so it
  will not fire on unrelated dirt like this file.
- **F1 — footwork readout on the live session + summary screens** → started as
  `feature-f1-surface-footwork-readout` (skip-hero). UI surface only, reusing
  `debug.tsx:183-210`; it gates the only defensible marketing angle. Explicit constraint
  in the prompt: the app never claims to name a move.

**Awaiting founder at cutoff:** three Pace branches to merge by hand (merge policy is
"review"; the engine never pushes a base branch) — `factory/feature-pace-social-page-signed`
($12.06), `factory/feature-move-territory-calculation`, `factory/feature-reduce-event-storage-phone`.
No open gates, no held deploys.

**Carried:** the shirtless-footage reach risk (a silent IG down-rank corrupts the
small-stranger-audience test the whole pipeline reads its signal from) — cheapest fix a
vest, better fix the skeleton-replay export. Not started; needs a founder call on which.

### 18:00 EOD sync (chief of staff) — engine- and git-verified

Reconciled every in-flight claim above and in `apps/pullup/STATUS.md` against
`factory-run list` / `status --json` histories, `orchestration/telemetry.db`, per-run
`engine.log`s, `git log` / `git branch -vv` / `git worktree list` / `merge-base` in all
three rigs, and the OpenClaw `subagent_runs` table.

**State of play at close: zero runs executing, zero gates open, one run failed today,
three runs `awaiting-merge`, no active subagents.**

**Corrections to the 11:00 cutoff entry above (both items it listed as "started"):**

- **`feature-f1-surface-footwork-readout` did not run — it FAILED at 15:05 BST**
  (14:05:55 UTC), step 1/11 `plan-discussion`, reason `discussion idle timeout hit
  (240 minutes with no founder activity) — failing loudly, never auto-approving`.
  $3.06 spent, **zero commits** (its branch tip is just main). The plan step succeeded:
  it verified the approach against the code (`landing-detected` carries `feet`/`stance`,
  `SessionRuntime.recentLandings` is what the debug feed renders, the summary screen
  already reads a single `SessionDetail` projection) and posted a good plan summary to
  Slack at **11:05 BST**. Nobody answered for four hours. `plan.md` and the full
  discussion transcript are preserved under
  `orchestration/runs/feature-f1-surface-footwork-readout/` — a retry can re-use them
  and start from the same plan. **The only defensible marketing wedge (D28) is
  therefore still unbuilt.**
  Engine notified Slack correctly both times (question 11:05, failure 15:06), so this
  is a missed reply, not a missed dispatch — the opposite failure mode to 08-06.
  Harness follow-up: a *discussion* gate that hits its idle timeout destroys the run and
  its spend. It should park the run as `awaiting-approval` indefinitely, or checkpoint so
  a retry resumes at turn 2, rather than terminating work that had already passed plan.
- **`bug-preflight-assertion-fails` is `done` and merged** — `c5a77a6` (11:11) +
  `308b947` (11:17), $6.46 (the entry estimated ~$4). Runs now abort at preflight while
  `orchestration/rigs.json` is uncommitted. Confirmed live in the f1 run's own preflight
  block.

**Idle since 11:17.** No file was written anywhere under `~/src` after 11:20 except
`telemetry.db` and the f1 run's own failure records — verified by `find -newermt`. No
subagent was spawned today. That is 6h45m idle, the second consecutive day with a long
dead afternoon, though for a different reason than yesterday's.

**Awaiting founder, unchanged since the cutoff and now verified by `merge-base`:** all
three Pace branches are genuinely unmerged into `running-with-pace` main —
`factory/feature-pace-social-page-signed` (4 commits, $12.06),
`factory/feature-move-territory-calculation` (4 commits, $28.82),
`factory/feature-reduce-event-storage-phone` (5 commits, $50.52). All three sit at
`awaiting-merge` 11/11 with review and tests green. **$91.40 of finished, green work has
now been parked for a full day** because the pace merge policy is "review" and the engine
never pushes a base branch.

**Overnight skip-hero work absent from the narrative above** (all landed before the
standup, all on main and pushed): `a49123c` founder pre-fix device captures as fixtures
guarding ADR 0023, `81c2c61` drop the redundant y-flip in live iOS pose mapping,
`bug-live-ios-pose-y` (done, $11.22, incl. a founder-approved golden re-baseline and a
correct auto-revert of protected-path changes), and the `examples/img-0502-regression-fixture`
merge `0285e4d` carrying the OTA badge plus the IMG_0502/0508/0509 goldens.

**`running-with-pace` is still not listed under "Active apps"** — the 08-07 standup
flagged this itself and it was not fixed. It has three finished runs awaiting merge and
was the largest overnight consumer. Fix at the next standup or now.

**Housekeeping — re-verified 18:00, and it has got worse, not better:**

- **`app-factory` main is 37 commits ahead of `origin/main`** (recorded as 12 at the last
  EOD; nothing was pushed in between). Everything from the per-rig merge policy through
  today's preflight assertion exists only on this machine. This is now the single largest
  piece of unmanaged risk in the factory. Working tree clean apart from `STATE.md`.
- **`skip-hero` main is in sync with origin** — the "2 commits ahead" from 08-06 was
  cleared overnight. Untracked there: `marketing/` (5 files, still), plus a new `app.json`;
  modified `.gitignore`. The `app.json` appearing untracked is worth a look — it is
  normally a tracked Expo config.
- **`running-with-pace` main is in sync with origin.**
- **Merged-but-unreclaimed skip-hero branches are up from three to five**, each still
  holding a worktree: `bug-save-video-not-working`, `feature-split-preview-into-two`,
  `feature-pose-stabilizer-tracking`, `feature-retry-failed-run-feature`, and the empty
  `feature-f1-surface-footwork-readout`. All are ancestors of main and safe to delete. The
  08-06 harness fix for this — reclaim on "branch is an ancestor of the base branch", not
  only "this run merged it" — was written down and never built. Third day carried.
- `feature-msdpir37` is **closed**: worktree and branch force-removed 09:16, 2.10 GB
  reclaimed, tip preserved as tag `archive/feature-msdpir37`. Confirmed on disk.

**Needs founder attention tomorrow (in order):**

1. **Merge the three Pace branches** — $91.40 of green, reviewed work idle for a day.
   This is one command per branch and it is the highest-value thing on the list.
   The policy question behind it (should a "review" rig auto-merge once review + tests
   pass?) is still the founder's and still unanswered.
2. **Retry F1 (`feature-f1-surface-footwork-readout`)** — it died on a four-hour
   unanswered plan question, not on a problem. The plan was correct and is on disk.
   **Ask: approve the plan as posted so the retry runs straight through** (it is the
   only surface that makes the D28 footwork wedge filmable).
3. **`app-factory` is 37 commits unpushed.** One `git push` fixes it. The standing
   policy question — should harness merges push the base branch? — has now been open
   three days while the exposure tripled.
4. **Product destination, still missing.** D27 made skip-hero the priority and D28 named
   the wedge, but there is still no ship date, no v1 scope line, and no store-submission
   target. The marketing research and the F1 surface both exist to serve a launch that
   has not been scheduled.
5. **Marketing workflow template** — a reusable `factory-run` workflow off
   `docs/marketing/synthesis/playbook.md`. Unstarted, unassigned, fourth day carried.
6. **Shirtless-footage reach risk** — vest or skeleton-replay export. Needs a call.
7. Still open from 08-05: branch protection on `main` (item 3 keeps making this more
   relevant) and local-vs-rented VM timing.

## Today — 2026-08-10 (NO STANDUP POSTED; cutoff cron fired 21:26, ~10.5h late)

**The factory was dark all day and the standup never ran.** Recorded by the
`factory-standup-cutoff` cron at 21:26 BST. Nothing was dispatched — there was no
posted proposal to proceed with, and 21:26 is not the hour to start a day's work.

Verified:
- `#factory-standup` has **zero messages dated 2026-08-10**. Last channel message is
  the founder's 2026-08-09 19:06 thread on `self-weekly-self-review-find`. Last
  standup posted: Sunday 09 Aug 08:04.
- `factory-run status --json`: **zero runs created or updated today.** Last engine
  activity is `bug-run-progress-does-not` reaching `awaiting-merge` at
  2026-08-09 18:57 UTC.
- `find ~/src/{app-factory,skip-hero,running-with-pace} -newermt 2026-08-10` →
  **no files written today** in any rig.
- No founder message today, so the cutoff has nothing to re-plan against.

**~~Root cause candidate — the standup cron is unreliable, third occurrence.~~
CORRECTED at the 21:31 EOD sync — the crons were fine; the host was asleep.**
`pmset -g log`: the MacBook entered **'Low Power Sleep' at 2026-08-10 07:25:06 BST at
1% battery** (TCPKeepAlive inactive) and did not wake until **21:26:20 on AC power**.
The factory was dark for 14 hours because the machine was off, not because the
scheduler is broken. `openclaw cron list` confirms it: `factory-daily-standup`,
`factory-standup-cutoff` and `factory-eod-sync` all show `Last: ~21:24` with status
`ok` — three different schedules (08:00, 11:00, 18:00) firing within two minutes of
each other is wake-catch-up, not three independent failures. The 08-09 and 08-06 cron
failures were real but are a **separate, lower-severity** issue; today is not a third
occurrence of them. Real harness gap: **the factory has no power/availability
guarantee** — an unplugged laptop at 1% silently costs a full working day, and the
catch-up burst then fires a standup at an hour when it is useless.

**Open items — RE-VERIFIED 2026-08-10 21:31 against GitHub, not the engine.
The engine's `awaiting-merge` list is STALE: 4 of its 6 entries are already merged.**
Verified with `gh pr list`, `gh pr view --json mergeCommit`, and `git log origin/main`
after `git fetch --prune`:
- **Genuinely open — 2, not 6:**
  - `bug-run-progress-does-not` (pace, $9.53) — **PR #45 genuinely OPEN**, unmerged.
    Real founder-merge item.
  - `feature-two-cold-start-stalls` (pace, $7.73) — 1 commit (`a142b20`) on
    `factory/feature-two-cold-start-stalls`, **no PR was ever opened**. This is not
    awaiting the founder, it is **stuck**: work finished 08-07 and never surfaced.
- **Already merged — engine state wrong, no founder action needed:**
  - `feature-pace-social-page-signed` → PR #40 squash-merged 08-09 12:09 (`8024ff2`).
  - `feature-move-territory-calculation` → PR #41 squash-merged 08-09 12:35 (`161fb44`).
  - `feature-reduce-event-storage-phone` → PR #42 squash-merged 08-09 14:16 (`d49527a`).
  - `bug-app-startup-very-slow` → merged 08-07 via merge commit `86ffe89`.
  Squash-merge is why the engine missed these: the branch tip is never an ancestor of
  `main`, so any ancestor-based merge check reads a squashed PR as unmerged. The
  engine's `sync` verb (D29) needs to reconcile on **PR state**, not commit ancestry.
- `bug-century-club-goal-shows` (pace, failed, $0.00): its branch sits **exactly at
  `main` with 0 commits** — the run died in setup and produced nothing. The branch and
  worktree are empty artifacts and can be deleted; do not read this as merged work.
- **3 failed runs** unresolved: `bug-century-club-goal-shows` (pace, setup failed on
  `pace-node-js-server && npm install`), `feature-f1-surface-footwork-readout`
  (skip-hero, step 1/11, $4.00), `feature-msdpir37` (skip-hero, superseded).
- `self-weekly-self-review-find` **rejected** at step 1/3 — `analyze` wrote a clean 9KB
  `improvement-plan.md`, then `plan-gate` failed on the Slack send. The plan exists and
  has never been read by the founder.
  (Confirmed on disk: `orchestration/runs/self-weekly-self-review-find/improvement-plan.md`.)
- Zero gates open. Zero runs executing.
- **Unpushed local commits (found at this sync, not previously tracked):**
  `app-factory` main is **ahead 3** of `origin/main` (`85f51c2`, `9f9bb5c`, `d656c21` —
  the 08-09 web-console markdown work) and `skip-hero` main is **ahead 2**
  (`df06271`, `77920c0` — stabilizer provenance). All merged locally on 08-09 and
  never pushed; if this laptop is the only copy, that work is one disk failure from
  gone. `skip-hero` also has an untracked `marketing/` directory and a modified
  `.gitignore`.

### EOD sync note — 2026-08-10 21:31

This block was opened by the `factory-standup-cutoff` cron at 21:26 and then
**verified and corrected** by the `factory-eod-sync` run at 21:31. Two of its original
claims were wrong (cron root cause; 6 awaiting-merge) and are struck through /
restated above. Its factual claims about the day being dark — no Slack messages, no
runs, no files written — were re-checked and **hold**. Pace totals also corrected:
**8 engine runs, $143.41** to date, not "five runs, ~$104" as written in the
running-with-pace bullet above.

## Today — 2026-08-11 (overnight, founder-driven)

### Golden regressions do not run from raw footage — TODO, no code changed

Founder's stated expectation: "it is supposed to be run on the raw footages — we run
[them] through the pose + skip engine algorithm pipeline and compare to a known good
output state." **The harness does not do this today.** `npm run golden:check`
(`scripts/golden-check.ts`) discovers `examples/*.recording.json` — already-extracted
pose frames — and replays only from there. `tools/pose-extract` (the Swift/Vision
video → pose stage) is invoked by no check: not `golden:check`, not `npm run check`,
only the manual `scripts/debug-video.sh`. So the golden suite covers detectors +
stabilizer; **video → pose is untested by it.**

Why this matters and is not academic: the `feature-skip-hero-s-pose` bug was exactly
a pose-stage defect (Vision scoring an inverted image, hip p50 0.22 vs 0.73), and it
was **invisible to every geometric check** because the geometry stayed correct while
the confidences rotted. A regression suite that starts after pose extraction can go
green straight through that entire class of bug.

**Founder direction 2026-08-11 00:36: do not change regressions code now. Note for
standup and later todos.** Two candidate shapes, unranked pending founder call:
- Extend goldens to start from raw video. Real end-to-end coverage. Costs: ~450MB of
  `.MOV` must be reachable in CI (git-lfs or external fixture store), `pose-extract`
  must be built as part of the check, and Vision's determinism across macOS versions
  is **unverified** — could be flaky.
- Cheaper: a separate pose-stage check pinning video → `recording.json` on one or two
  short clips, run nightly or manually rather than inside `npm run check`.

Note the run itself partly closed this: it added `npm run orientation:check` and
`npm run parity:check`, plus a median-hip ≥ 0.5 confidence gate on the goldens. Those
are the first non-geometric axes in the suite. They are not yet wired into
`npm run check`.

### Raw footage library created

`~/.openclaw/workspace/media/skip-hero-footage/` — 13 files, 448MB, `MANIFEST.json`
carries provenance (Slack file id, channel, date, matching session bundle, whether a
golden exists). Swept all seven factory Slack channels, not just `#factory-skiphero`.
Founder's intent is explicitly broader than regressions: **collect these for future
content generation too.**
- 9 newly pulled from Slack; 4 already on disk were hardlinked (same inode, one copy,
  both paths valid), saving ~300MB.
- Verified, not assumed: byte sizes match Slack originals exactly; every file decodes
  under `ffprobe` with a sane duration.
- 4 `ScreenRecording_*` files are in-app captures, not camera footage — tagged
  `app-screen-recording` in the manifest so they are never pulled into a fixture set
  by mistake. Useful as UI content material.
- `.movs` confirmed gitignored: skip-hero's `.gitignore:14` (`examples/*.mov`) covers
  both cases on this filesystem. The **workspace repo had no `.gitignore` at all** and
  would have swallowed 448MB into an 80KB `.git` — one added at
  `~/.openclaw/workspace/.gitignore`.

### Backup risk — carried forward, now larger

`IMG_0446.MOV` (oldest fixture, has a committed golden) **exists nowhere in Slack** —
it predates the channels or arrived out of band. It is a single local file. The whole
448MB library is now in the same position, on top of the unpushed-commit exposure
already logged at the 08-10 EOD sync. No durable backup exists for any of it.

### `feature-skip-hero-s-pose` — check gate approved, run resumed

Was parked at `awaiting-approval`, step 3/11, since 23:14. `golden:check` failed on
`FAIL no golden at examples/device-2026-08-10-210231.recording.golden.json` — the run
added the fixture (session `d5d61aa1`) but a golden is only ever written by
`golden:update`, which is founder-gated. Approved per founder instruction 00:36 via
`factory-run approve`, which ran the rig's sanctioned `onApprove` re-baseline.
- Commit `2d40211` "harness: founder-approved golden re-baseline": **947 insertions,
  zero deletions.** The new golden is 911 lines; the 6 existing goldens each gained
  exactly 6 lines (the confidence-stats stamp). **No existing event timeline was
  altered** — including the two protected pre-fix `device-2026-08-06-*` baselines.
- Checks then passed; run advanced to `review` (step 4/11) at 23:38.

**Still gated on the founder** (from the run's own `todo-summary.md`, unchanged by me):
- Run the ADR 0026 hardware protocol on a physical iPhone — orientation resolves
  `.right`, hip p50 ≈ 0.65+, parity passes on a fresh export. The run's fix to the
  `VNImageRequestHandler` orientation is **inferred, not hardware-confirmed**, and
  hardware confirmation is a required part of done.
- Decide whether the `1db6fa50` bundle should also land as a fixture. Ask C of the
  brief said both sessions; the run landed only `d5d61aa1` and deliberately left this
  as a founder call. Its `.MOV` is now available either way.

---

## 2026-08-11 — 11:00 standup cutoff (no founder reply; posted proposal proceeded)

Standup posted 08:02 BST. No founder message in `#factory-standup` after
2026-08-09 18:06, so the 11:00 cutoff fired and the posted proposal was executed as
written. Founder can still redirect any of it.

**Done at the cutoff:**

- **`app-factory` main pushed** — `1f99a02..db4de5b`, 4 commits including D31 itself.
  The unpushed-commit exposure logged at the 08-10 EOD sync is closed for this repo.
  The 448MB footage library remains unbacked-up.
- **PR #52 merged** (magnetometer + follow-mode map rotation, running-with-pace),
  squash, checks green, `mergeStateStatus: CLEAN`. `factory-run sync
  feature-introduce-magnetometer` → `done`. Local branch delete deferred: the worktree
  was still mounted at merge time.
- **`feature-android-pose-parity-spike` check gate approved** — was parked at
  `awaiting-approval` (step 3/11, `npm run golden:check`) for 9h32m. Resumed on its
  own executor at 10:02Z, now at `review` (step 4/11). $13.22 spent so far.

**Item 1 of the proposal was already dead when the cutoff ran.**
`feature-jittery-compass-driven-map` hit the 240-minute plan-discussion idle timeout at
**07:42:27Z (08:42 BST)** — the exact failure the morning's introspection line
predicted, ~18 minutes after the standup was posted. $2.17 and the plan lost.

Restarted as **`feature-jittery-compass-driven-map-2`**, fresh run rather than a
resume, because the original's worktree/base was the magnetometer branch which is now
squash-merged into main (D31 leaves no base-drift recovery path — a stale-base resume
would have produced an empty or conflicting diff). The prior `plan.md` is referenced
in the new prompt for reuse.

**New harness defect found while trying to rescue it (unprompted, worth recording):**
`factory-run retry` **cannot rescue a timed-out discussion gate.** The retry requeued
the run, re-posted the gate at turn 1/8 at 10:03:00.523Z, then failed it again at
10:03:00.525Z — **2ms later** — with the same idle-timeout reason. The idle clock is
measured from the *original* gate post (03:42Z), not from the resume, so any
discussion-timeout run is permanently unrecoverable by retry.

**Introspection item approved by silence** — started
**`bug-gates-die-silently-idle`** (app-factory, bug-fix, ~$8 estimated). Scope: re-ping
the gate's channel at 50% and 80% of the idle budget with run/step/approve-command/
time-to-timeout; reset the idle budget on resume (the defect above, with a regression
test); surface open gates + time-to-timeout in `factory-run status`/`list` so the
standup can list them. Explicitly not auto-approval — the loud failure and the founder
veto both stay.

**Carried forward, fourth day, still unanswered:** skip-hero has no ship date, no v1
scope line, no store-submission target. The pose work, the Android parity spike and the
marketing research all serve a launch nobody has scheduled. This is now the oldest open
question in the factory.

**In flight after the cutoff:** `feature-android-pose-parity-spike` (skip-hero,
review), `feature-jittery-compass-driven-map-2` (running-with-pace, planning),
`bug-gates-die-silently-idle` (app-factory, planning). No new specialists. Engine
(`factory-run status --json`) remains the authority over this narrative.
