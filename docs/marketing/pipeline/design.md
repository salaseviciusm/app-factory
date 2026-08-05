# The content pipeline — end-to-end design

**Design goal, in the founder's words:** *"I'll supply demos and videos of me using the
apps, and then get an AI agent to edit it, turn it into good content that can get
attention. Build a hands-off pipeline to generate and test content, where the marketing
team suggests me video ideas, I record the demos, and an automated pipeline edits the
videos."*

**The founder's only recurring manual step should be recording.** Everything else is
agents, deterministic scripts, and two short approval taps.

This design is built on the engine that actually exists — `orchestration/bin/factory-run`
and `orchestration/rigs.json` — not an imagined one. Section 2 documents exactly what the
engine gives us for free and the two places it needs a small extension.

---

## 0. The rule the whole design obeys

From `../platforms/tiktok/credibility.md` §2, and it is the load-bearing constraint:

> **AI does the editing, the founder does the saying. Volume comes from more raw footage,
> not from more permutations of the same footage.**

Every design decision below follows from that. The pipeline is not a multiplier that turns
1 clip into 15 posts — that shape is precisely what TikTok's originality enforcement (from
15 Sep 2025), Instagram's duplicate-content rules, and YouTube's inauthentic-content policy
(3 named demonetisable categories, published 16 Jul 2026) were built to suppress. The
pipeline is a **conveyor**: it takes N distinct raw clips and produces N finished posts
with near-zero founder time in between.

The three cross-platform hard limits it enforces mechanically:

1. **No source clip appears in more than 3 published videos, and never as primary footage twice.**
2. **Zero watermarks, ever** — a documented, silent, total reach-kill on Instagram.
3. **The founder watches every video before it ships.**

---

## 1. The loop, at a glance

```
   ┌── Sunday 17:00 ──────────────────────────────────────────────┐
   │  [1] IDEA GENERATION      agent, weekly cron                 │
   │      reads: last week's metrics · search-query inventory     │
   │             · unanswered comments · reuse ledger             │
   │      writes: docs/marketing/briefs/YYYY-WW.md                │
   └───────────────────────────┬──────────────────────────────────┘
                               ▼
   ┌── Slack #factory-marketing ──────────────────────────────────┐
   │  [2] SHOT LIST + FOUNDER GATE     discussion step            │
   │      8–15 one-line shots. Founder cuts, adds, approves.      │
   │      ◆ HUMAN GATE 1 — the only judgement call that matters   │
   └───────────────────────────┬──────────────────────────────────┘
                               ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  [3] FOUNDER RECORDS       ~40 min, once a week               │
   │      Phone/screen recorder → ~/factory-media/inbox/           │
   │      Names each file with the shot number. That's it.         │
   └───────────────────────────┬──────────────────────────────────┘
                               ▼  (watcher cron, every 10 min)
   ┌──────────────────────────────────────────────────────────────┐
   │  [4] INGEST         deterministic · ffprobe, WhisperX         │
   │  [5] AUTO-EDIT      deterministic · auto-editor, ffmpeg       │
   │  [6] VARIANTS       agent · hooks, captions, on-screen text   │
   │  [7] RENDER         deterministic · per-platform masters      │
   │  [8] ANTI-SLOP REVIEW  agent · reviewer verdict, loops back   │
   └───────────────────────────┬──────────────────────────────────┘
                               ▼
   ┌── Slack #factory-marketing ──────────────────────────────────┐
   │  [9] PREVIEW + FOUNDER GATE    gate step, MP4 attached       │
   │      ◆ HUMAN GATE 2 — 20 seconds per video, thumbs up/down   │
   └───────────────────────────┬──────────────────────────────────┘
                               ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  [10] SCHEDULE + POST     Postiz queue · TikTok via drafts    │
   │  [11] MEASURE             nightly metrics pull → telemetry.db │
   └───────────────────────────┬──────────────────────────────────┘
                               └──────────► back into [1]
```

**Founder time per week: ~40 minutes recording + ~5 minutes of gates.** Everything else
runs unattended.

---

## 2. Fitting this to the real engine

### 2.1 What `factory-run` already gives us

Read from `orchestration/bin/factory-run`:

| Engine feature | How the pipeline uses it |
|---|---|
| **Step types** `agent`, `commands`, `gate`, `discussion`, `deploy`, `notify`, `spawn` | The whole pipeline is expressible in these. No new concepts needed. |
| **`"worktree": false`** on a workflow (used today by `self-review.json`) | Content workflows run against the live checkout instead of a git worktree — correct, because raw video must not go into git. |
| **`notify(run, message, mediaPath)`** — the notify path already accepts a media attachment (`notifyArgs(to, message, mediaPath)`) | **This is the key enabler for Human Gate 2.** The rendered MP4 is posted straight into Slack, so the founder approves the actual video, not a filename. |
| **`gate` step** → `waitForGate`, sets state `awaiting-approval`, skippable with `run.auto` | Human Gate 2, exactly as-is. |
| **`discussion` step** (`maxTurns`, `idleTimeoutMinutes`) | Human Gate 1 — a real back-and-forth about the shot list in Slack, same mechanism `new-app.json` uses for spec discussion. |
| **`review` step convention** — an agent step whose id is `review` gets its output run through `evaluateReview()`, reading `review.json` for `{verdict, findings}`; on FAIL the engine writes `findings.md`, archives it, and loops back with `onFail` / `maxLoops` | **The anti-slop checklist becomes a reviewer prompt.** Fail → the variants step re-runs *with the findings injected into its prompt*. This is a genuine self-correcting edit loop we get for free. |
| **Per-rig Slack channel** (`notifyChannelName`) | `#factory-marketing`. |
| **Telemetry** — `telemetry.db`, `tStep`, `tArtifact`, `runUsage` | Per-video artifacts (source clip id, hook variant, platform, post URL) recorded as artifacts; token cost per video already tracked. |
| **`spawn` step** — launches a child workflow with a prompt file from the parent's run dir | The weekly brief run spawns one `content-cut` run per approved shot. |
| **Cron registration** via `openclaw cron add` (see `openclaw/setup-automations.sh`) | Weekly brief, 10-minute ingest watcher, nightly metrics pull. |
| **Preflight** — verifies external CLI contracts before any agent step | Extended to check `ffmpeg`, `ffprobe`, `whisperx`, `postiz` are on PATH. Fails fast instead of dying mid-render. |

### 2.2 The two places the engine needs a small extension

These are real gaps found by reading the code, not hypotheticals.

**Gap 1 — `commands` steps can only run the rig's `checks` or `tests` arrays.**

```js
function runCommandsStep(run, step, rig) {
  const cmds = rig[step.source] || [];   // ← source is "checks" or "tests"
```

There is no way to declare per-step commands in a workflow. Our pipeline has four distinct
deterministic stages (ingest, auto-edit, render, post) and only two slots.

- **Cheapest viable fix (no engine change): one script, many subcommands.** Add
  `bin/content-pipeline` to the repo with `ingest`, `cut`, `render`, `publish`
  subcommands. Agent steps invoke it via Bash. Works today, zero engine risk.
  *Trade-off:* the stage runs inside an agent's context, so a deterministic ffmpeg failure
  surfaces as an agent-step failure rather than a clean `findings.md` — slightly worse
  telemetry, slightly fuzzier failure modes.
- **Upgrade trigger:** the first time an ffmpeg failure is misdiagnosed by an agent, add
  inline `"commands": [...]` support to `runCommandsStep` (a ~10-line change:
  `const cmds = step.commands || rig[step.source] || []`). Ship it as a normal
  `feature-dev` run on the `app-factory` rig.

**Gap 2 — there is no `publish` step type.** `deployStep` supports `eas-update`,
`harness-merge`, and `none` only.

- **Cheapest viable fix:** publishing is `bin/content-pipeline publish` called from an
  agent step, same as above.
- **Upgrade trigger:** when we are posting to 3+ platforms per video and want per-platform
  retry semantics and artifact URLs in telemetry, add a `deploy.type: "social-publish"`
  branch to `deployStep` so posts get first-class `artifactUrl` treatment.

### 2.3 The rig

Added to `orchestration/rigs.json`:

```json
"marketing": {
  "path": "~/src/app-factory",
  "tier": "production",
  "defaultBranch": "main",
  "notifyChannelName": "factory-marketing",
  "setup": [],
  "checks": [
    "bin/content-pipeline doctor",
    "node --check bin/content-pipeline"
  ],
  "tests": [],
  "appDir": ".",
  "deploy": { "type": "none" }
}
```

`"path"` points at the app-factory repo because that is where the briefs, the idea bank,
the reuse ledger and the pipeline script live — all of which *should* be version-controlled.
**Media does not live there.** Raw and rendered video live in `~/factory-media/`, which is
outside the repo entirely. Workflows set `"worktree": false` so agents operate on the live
checkout and can reach the media directory by absolute path.

### 2.4 The three workflows

**`orchestration/workflows/content-brief.json`** — weekly, Sunday 17:00

```json
{
  "name": "content-brief",
  "description": "Weekly content brief: read last week's performance, generate a shot list, agree it with the founder, spawn a cut run per approved shot.",
  "worktree": false,
  "steps": [
    { "id": "analyse",     "type": "agent",      "prompt": "content-analyst",  "timeoutMinutes": 20 },
    { "id": "ideate",      "type": "agent",      "prompt": "content-ideator",  "timeoutMinutes": 20 },
    { "id": "shot-list",   "type": "discussion", "prompt": "content-shotlist", "agent": "marketing-lead",
                           "maxTurns": 6, "idleTimeoutMinutes": 1440, "timeoutMinutes": 20 },
    { "id": "notify",      "type": "notify" }
  ]
}
```

**`orchestration/workflows/content-cut.json`** — one run per raw clip

```json
{
  "name": "content-cut",
  "description": "One raw clip in, one approved multi-platform post out.",
  "worktree": false,
  "steps": [
    { "id": "ingest",   "type": "agent", "prompt": "content-ingest",   "model": "haiku", "timeoutMinutes": 15 },
    { "id": "edit",     "type": "agent", "prompt": "content-editor",   "timeoutMinutes": 30 },
    { "id": "variants", "type": "agent", "prompt": "content-variants", "timeoutMinutes": 20 },
    { "id": "render",   "type": "agent", "prompt": "content-render",   "model": "haiku", "timeoutMinutes": 30,
                        "onFail": "edit", "maxLoops": 2 },
    { "id": "review",   "type": "agent", "prompt": "content-reviewer", "model": "sonnet", "timeoutMinutes": 15,
                        "onFail": "variants", "maxLoops": 3 },
    { "id": "preview",  "type": "gate" },
    { "id": "publish",  "type": "agent", "prompt": "content-publish",  "timeoutMinutes": 20 },
    { "id": "notify",   "type": "notify" }
  ]
}
```

Note `review` uses the engine's existing reviewer convention — the agent writes
`review.json` with `{"verdict": "PASS"|"FAIL", "findings": [...]}`, and on FAIL the engine
writes `findings.md` and loops back to `variants` with the findings injected. **The
anti-slop checklist gets three automatic attempts before it ever reaches the founder.**

**`orchestration/workflows/content-report.json`** — nightly metrics, weekly report

```json
{
  "name": "content-report",
  "description": "Pull per-video platform metrics and App Store campaign data, write them to telemetry, and update the idea bank.",
  "worktree": false,
  "steps": [
    { "id": "collect", "type": "agent", "prompt": "content-collect", "model": "haiku", "timeoutMinutes": 20 },
    { "id": "report",  "type": "agent", "prompt": "content-report",  "timeoutMinutes": 20 },
    { "id": "notify",  "type": "notify" }
  ]
}
```

### 2.5 Crons

```sh
openclaw cron add "0 17 * * 0" --  factory-run start marketing content-brief   # Sunday brief
openclaw cron add "*/10 * * * *" -- content-pipeline watch                     # ingest new clips
openclaw cron add "0 3 * * *"   --  factory-run start marketing content-report # nightly metrics
```

The watcher is a plain script, not a workflow: it scans `~/factory-media/inbox/`, and for
each new file that has been stable for 60 seconds it calls
`factory-run start marketing content-cut "<clip path>"`. Deliberately dumb.

---

## 3. Stage by stage

### [1] Idea generation — agent, weekly

**Inputs, all machine-readable:**
- Last 14 days of per-video metrics from `telemetry.db` (see §4)
- `docs/marketing/inventory/search-queries.md` — the 20–30 "app for X" / "how do I X"
  queries per app that `../platforms/tiktok/algorithm.md` §6 calls "the single most
  defensible organic tactic on the platform for a studio with a demo library"
- `~/factory-media/ledger.json` — the reuse ledger: every source clip and how many
  published videos it appears in
- Unanswered/high-signal comments pulled by the nightly collector
- The apps' recent changelogs and bug reports (we are already a factory; this is free)

**Output:** `docs/marketing/briefs/YYYY-WW.md` — 8–15 candidate shots, each one line, each
tagged with: the app, the format, the target search query (if any), and *why now*.

**Composition rule, enforced in the prompt** — this is what keeps the output from being
format-correct and substance-empty:

| Slot | Target per week | Source |
|---|---|---|
| Search-query answers | 5–7 | The query inventory; permanently discoverable inventory for high-intent traffic |
| Comment-reply videos | 5–7 (≥1/day) | Real questions from real comments. `../platforms/tiktok/credibility.md` §5: *"at least one video per day is a reply to a real comment"* — unambiguously original, self-hooking, and evidence of a human |
| Something that broke | 1–2 | A bug, a bad review, a rejection. Naming a genuine limitation is on the *authentic* side of the slop table |
| Genuinely new feature/app | 1–2 | Changelog |

**Default model:** Claude Opus 5 for the ideation pass, run through the **Batch API at 50%
off** — it runs Sunday evening and nobody is waiting on it.
**Trade-off:** batch adds up to an hour of latency. Irrelevant here; would not be for the
per-video steps.
**Upgrade trigger:** none. This step costs pennies.

### [2] Shot list + Human Gate 1 — `discussion` step

The agent posts the shot list to `#factory-marketing`. The founder replies in plain
language ("drop 3 and 7, add one about the offline sync bug"). Up to 6 turns,
24-hour idle timeout. On approval the run writes `approved-shots.md`.

**Why this is a conversation and not a yes/no gate:** this is the only step where the
founder's judgement is irreplaceable. Agents are very good at format and have nothing to
say; **specificity is the cheapest anti-slop signal we have and the founder is the only
source of it.** Ten minutes here is worth more than any amount of downstream automation.

**Then:** the run spawns one `content-cut` run per approved shot. But the child runs sit
idle until footage arrives — so in practice the brief run just writes the shot list and the
*watcher* spawns cut runs as files land. Simpler, and it tolerates the founder recording
shots out of order or skipping some.

### [3] Founder records

The entire manual protocol:

1. Read the shot list on your phone.
2. Record each shot. Screen recording for demos; front camera for talking. Real device, real hands, imperfect framing, room tone. **Your voice on every single one.**
3. Save each file as `NN-slug.mov` where `NN` is the shot number.
4. Drop the folder into `~/factory-media/inbox/`.

Nothing else. No trimming, no captions, no thinking about aspect ratio, no re-takes for
polish (a stumble is a *feature* — see the authenticity checklist). Bad takes: record the
shot twice and let the pipeline pick; that is one of the things it is genuinely good at.

**Target: 8–15 distinct raw clips per session, ~40 minutes.**

### [4] Ingest — deterministic

`bin/content-pipeline ingest <file>`:
- `ffprobe` → duration, resolution, fps, audio presence. **Reject silently-recorded clips loudly** — no voiceover means no post.
- WhisperX → word-level transcript JSON.
- Perceptual hash of the first/middle/last frames → registered in `ledger.json` for reuse tracking.
- `loudnorm` pass 1 (measure).
- Writes `~/factory-media/work/<run-id>/` with source, transcript, and metadata.

**Model:** Haiku 4.5 drives this step — it is file-shuffling and error-reporting, not judgement.

### [5] Auto-edit — deterministic + one judgement call

`bin/content-pipeline cut`:
- `auto-editor` removes silence and dead air using a conservative threshold. **Conservative deliberately:** `../platforms/tiktok/credibility.md` §2 puts *"screen recording at real speed, including a loading spinner"* on the authentic side and *"speed-ramped, zoom-punched, every frame optimised"* on the slop side. We remove dead air, not breath.
- Crop/pad to 1080×1920, then a 1920×1080 variant for YouTube long-form if the clip warrants it.
- `loudnorm` pass 2 (apply).

**The one judgement call** (agent, Opus 5): if the founder recorded the same shot twice,
pick the stronger take from the transcripts and state why in one line. Also: propose the
in/out points for the strongest 15–45 s if the raw clip runs long.

### [6] Variants — agent

For one source clip, generate:
- **3 hook variants** — the first spoken line and the first on-screen text. Written *for the founder's voice* from his own words in the transcript, never invented claims.
- **Caption** — plain-language, containing the words a person would actually type. Instagram: hashtags are documented as *not improving visibility* and are capped at 5/post since 18 Dec 2025; TikTok: 3–5 specific tags matching real search phrases, never `#fyp #viral`.
- **On-screen text** — the target search query verbatim, because TikTok is `[ANECDOTAL]` believed to index on-screen text and it costs nothing to comply.
- **Pinned-comment text** — the App Store search string spelled out (TikTok has no clickable link in-video; the comment section *is* the install funnel).
- **YouTube description** with the tracked link + campaign token.

**What this step must never do**, encoded in the prompt as hard rules: generate a voice,
generate faces or scenes, produce b-roll implying real events, re-cut the same clip into
"different" videos, invent testimonials or numbers.

**Note on originality:** the 3 hook variants are **not 3 posts.** They are 3 candidates for
*one* post — except on Instagram, where Trial Reels give us a legitimate free A/B harness
(non-followers first, 24-hour read, no grid cost). See `feedback-loop.md` §2.

### [7] Render — deterministic

`bin/content-pipeline render`:
- Burn `.ass` captions built from WhisperX word timings.
- Export per-platform clean masters: TikTok 9:16, IG Reels 9:16 **≤90 s** (the API cap, not the app's 3-minute allowance), YouTube Shorts 9:16, YouTube long-form 16:9 where applicable.
- **Watermark check:** scan the corners of sampled frames for high-contrast static overlays and fail the run if anything is found. Cheap, and it guards a documented total-reach-kill.
- **Distinct-file check:** hash each rendered output; refuse to emit the same file for two accounts. Instagram documents that when it finds identical content it *"will only recommend the original one."*

### [8] Anti-slop review — agent, with automatic loop-back

The reviewer runs the merged checklist from the platform credibility docs and writes
`review.json`. Any FAIL sends the run back to `variants` with the findings attached, up to
3 times.

**Hard blocks (documented policy risk) — any one fails the run:**
- [ ] No visible watermark of any kind
- [ ] This exact rendered file has not been published to another account we control
- [ ] Source clip is at or under the 3-video reuse cap, and is not primary footage twice
- [ ] Founder's real voice is the audio (no synthetic narration on the primary account)
- [ ] Not a re-post of an underperformer
- [ ] Caption/on-screen text contains no unverifiable number or claim
- [ ] Distinct **premise**, not the previous video with one variable swapped
- [ ] Has a narrative arc: setup → problem → resolution (YouTube's own failure description is *"generic and don't really have a narrative arc"*)

**Judgement calls (advisory, surfaced to the founder rather than blocking):**
- [ ] Is the hook structurally different from our last three posts?
- [ ] Would a stranger understand what the app does from the muted first 3 seconds?
- [ ] Can you name one specific person a viewer would send this to? *(the documented unconnected-reach mechanic on Instagram)*
- [ ] Does the CTA deliver something real, or is it engagement bait?
- [ ] **Could this post be published verbatim by a competitor after swapping the product name?** If yes, it should not ship.

**Model:** Sonnet 5 — the same tier `feature-dev.json` already uses for its reviewer. Cheap,
fast, and the task is checklist evaluation rather than open-ended reasoning.
**Upgrade trigger:** if the reviewer starts passing videos the founder then rejects at Gate
2 more than ~1 in 5, move it to Opus 5 and re-baseline.

### [9] Preview + Human Gate 2 — `gate` step with the MP4 attached

The engine posts the rendered video into `#factory-marketing` with the caption, hook, and
target query. The founder watches ~20 seconds and approves or rejects.

**This gate is non-negotiable and it is cheap.** From the credibility doc: *"If an
agent-assembled video can't survive 20 seconds of the founder's attention, it won't survive
a viewer's 2."* At 15 videos a week that is five minutes.

`run.auto` exists in the engine and *will* be tempting. **Do not enable auto on
`content-cut`.** It converts a quality problem into a reputation problem, and the whole
originality/authenticity posture depends on a human having actually looked.

### [10] Schedule and post

| Platform | How | Why |
|---|---|---|
| **TikTok** | **Inbox/draft upload via the Content Posting API**, then the founder taps publish | Direct posting requires passing TikTok's audit; **unaudited clients can only post privately.** Draft upload needs no audit, keeps a human in the loop, and costs 5 seconds. It also lets the founder pick the cover frame and trending sound in-app. |
| **Instagram Reels** | Postiz → Content Publishing API | Works cleanly. Business/Creator account + FB Page. 100 posts/24h. **≤90 s via API.** |
| **YouTube Shorts + long-form** | Postiz → Data API `videos.insert` | Works cleanly. Uploads bill to their own daily bucket since June 2026. |
| **X** | Postiz → X API pay-per-use | $0.015/post, **$0.20 if it contains a URL** — so put the link in a reply, not the post. |
| **LinkedIn** | **Manual.** Draft written by the pipeline, posted by the founder | Partner-gated API; no legitimate programmatic path. |
| **Reddit** | **Manual.** Never automated | Free tier is non-commercial-only and registration needs manual approval; and Reddit is the platform where automation reads as spam fastest. |

**Cadence, from the platform research:**
- TikTok: 2–3/day per account after a **one-week ramp at ~1/day**. Inside TikTok's own 1–4/day guidance.
- Instagram: 5–8/week. Buffer's 2.1M-post dataset shows reach-per-post rising with cadence, but the real ceiling is *sameness*, not frequency.
- YouTube Shorts: 4–7/week. Long-form: 1/week sustained. YouTube states upload frequency is **not correlated with view growth** — consistency, not volume.
- X: 2–3/week, only when something real happened.

Scheduling is a Postiz queue, so a Sunday recording session drips out across the week
instead of dumping 15 videos on Monday.

**What is never automated:** replies, comments, and DMs. See `risks.md` §4 — LinkedIn
catches *"hundreds of thousands of automated comment attempts"* daily, X weights `report` at
−369 against `like` at +0.5, and TikTok's comment section is the install funnel. The
pipeline *drafts* replies for the founder to send; it never sends them.

### [11] Measure

Nightly collector writes to `telemetry.db`. Details in `feedback-loop.md`.

---

## 4. Data model

Three small files carry all the state. All version-controlled except the ledger's media paths.

**`~/factory-media/ledger.json`** — the reuse guard.
```json
{ "clips": [ { "id": "2026-W32-04", "phash": "…", "recorded": "2026-08-09",
               "app": "skip-hero", "transcript": "work/…/transcript.json",
               "used_in": ["v-0412"], "primary_in": ["v-0412"] } ] }
```
Rule: `used_in.length < 3` and `primary_in.length < 2` or the render step refuses.

**`docs/marketing/inventory/search-queries.md`** — per app, 20–30 real queries, each with
status (`open` / `covered:<video-id>`) and the observed installs-per-1k-views when covered.
This is the backlog that makes idea generation non-arbitrary.

**`telemetry.db`** — the engine's existing SQLite. Two new artifact types on each
`content-cut` run: `content_post` (platform, post URL, campaign token, hook variant id,
source clip id, format tag) and `content_metric` (platform, post id, metric, value,
observed_at). Both go through the existing `tArtifact()`.

---

## 5. Cheapest viable version, and what it costs to skip a step

If everything above is too much to build at once, this is the order:

| Order | Build | Founder time saved/wk | Cost |
|---|---|---|---|
| 1 | `bin/content-pipeline` (ingest/cut/render) + the watcher cron | ~3 h of editing | £0 |
| 2 | `content-cut` workflow with `review` + `preview` gate | Quality floor + the Slack preview | £0 |
| 3 | `content-brief` workflow + weekly cron | ~1 h of "what do I even film" | ~$1/mo |
| 4 | Postiz + `publish` | ~45 min of uploading | £0 (hosting) |
| 5 | `content-report` + Apple campaign tokens | Makes the loop a loop | £0 |

**Steps 1–2 alone deliver most of the value.** Steps 3–5 are what turn it from a tool into
a pipeline.

---

## 6. Decisions the founder needs to make

1. **One founder account across all apps, or one per app?** Every platform doc in this
   research set independently reaches the same answer — **primary: one founder-face
   account per platform, secondary: per-app brand accounts as catalogues.** The founder
   account is the only asset that compounds across the portfolio. But it commits the
   founder to being the face, permanently. That is his call, not ours.
2. **Is Human Gate 2 per-video or per-batch?** Per-video (recommended) is ~20 s × 15;
   per-batch is one Slack message with 15 attachments and one approval. Per-batch is
   faster and slightly worse.
3. **Does TikTok stay draft-mode, or do we pursue the audit?** Draft mode costs 5 s/video
   forever. The audit is a one-off application with an unknown timeline and adds a genuine
   (if small) enforcement surface. Recommendation: **stay in draft mode indefinitely** —
   it is the cheaper *and* safer answer, and the manual tap doubles as a second look.
4. **Do we run the `app-factory` rig's `feature-dev` workflow to build this**, or is it a
   hand-built one-off? Recommendation: build it as a normal feature-dev run so it gets the
   harness's own review and merge discipline.
