# Status — pullup

> Kept truthful by the chief of staff; verified against git/session records.

- **Stage:** 2 complete + feasibility spikes (2D **and** 3D) delivered. **BACKLOGGED —
  the founder sidelined the app entirely on 2026-08-06 (D27); skip-hero is the priority
  app.** This is stronger than the 08-03 hold: the spec gate is **withdrawn, not
  pending**. Do not advance any stage, re-open the gate, or list pullup as awaiting the
  founder until he explicitly reverses D27.
- **Last updated:** 2026-08-06 (D27 — backlogged, superseding the 2026-08-03 09:20 hold)
- **Last verified:** 2026-08-07 18:00 (EOD sync). Still correct, still dormant, nothing
  to change. No pullup runs in `factory-run list` or `telemetry.db` (ever); no subagent
  has been spawned since 2026-08-05 12:12; the only commit to touch `apps/pullup/` since
  `1e98a1d` (2026-08-04) is `f361b41` — the 08-06 EOD sync editing this very file, not
  product work. Artifacts intact on disk and in git. Dormant 4 days, correctly so under
  D27; skip-hero took all capacity again today (D28 named its wedge).
  _(Prior verification: 2026-08-06 18:00, same conclusion.)_

## BACKLOGGED (2026-08-06, D27) — supersedes the 08-03 hold

Founder: *"skiphero is now the priority. We can sideline/backlog the pullup app
entirely."* Pullup is **backlogged**, not killed. All artifacts (spec.md,
market-notes.md, spikes/001 2D + spikes/002 3D verdicts, decisions.md) remain on disk
and in git as a dated, resumable evidence pack. Nothing here is waiting on the founder;
there is no open question to answer. If the app is ever restarted, resume from the spec
gate with the questions in `spec.md`.

### Prior state — HOLD (2026-08-03)

Founder: "Nah hold off on this idea" — replying to the Monday standup's pullup spec-gate ask.
At that point pullup was **paused at an open gate** and the spec questions were still
live-but-parked. D27 closed that gate rather than leaving it parked.

## In-flight

_None active._ Product-lead handoff + both feasibility spikes delivered; app now on hold.

## Feasibility spike — DELIVERED (run `7e580994-…`)

**Stock footage (well-framed pull-ups) → VALIDATED / go.** On-device Apple Vision
`VNDetectHumanBodyPoseRequest` tracks pull-ups through full ROM including the occluded top:
wrist conf ~0.80–0.83 at rep tops, ~100% of frames have a usable wrist. No ARKit body
tracking or Create ML model needed for v1. Production guidance baked in:
- Build rep + top-of-rep on **elbow angle** (primary); nose-based chin-over-bar is a
  secondary UI cue only — the nose flickers when the chin tucks over the bar.
- **Ignore hips** (lower body cropped/occluded → 0–21% confident; not needed for ROM).
- Ship an in-app **framing guide**.

**Founder's own footage → PARTIAL for "impromptu" capture.** Founder sent two garden clips:
(1) pushups filmed worm's-eye (phone flat on ground), (2) pull-ups filmed **from behind**
(face away → nose metric impossible; wrist detection intermittent at that rear/low angle).
Neither is a clean front/¾ pull-up, so they don't validate the mechanic on his setup — but
they prove a real-world constraint: usable tracking drops to ~44–67% at bad angles/close-ups
vs ~100% front-on. **This makes the capture UX a first-class v1 requirement:** upright phone,
front/¾ orientation, face+body+bar in frame, plus a live confidence/orientation gate that
tells the user to reframe instead of logging garbage reps.

Handoff context: stages 1–2 drafted into spec.md; product-lead verdict **BUILD-WITH-CHANGES**,
gated on this spike (now in). Do NOT proceed to brand/design/architecture until the founder
answers the spec-gate questions.

## Blocked

**Nothing is blocked, because nothing is scheduled.** The two founder dependencies below
are **archived, not pending** — they were parked by the 08-03 hold and closed by D27 on
08-06. They become live again only if the founder explicitly restarts the app:
1. **Spec gate** — founder to answer the product-lead's open questions in `spec.md`.
2. **One clean front/¾ pull-up clip** (face visible, phone upright) to close end-to-end
   validation on the founder's actual conditions. `IMG_0451.MOV` never resolved to disk —
   re-share if intended. Until then, real-world capture verdict stays PARTIAL.

## Done this week

- Stage 1 refinement: problem, target user (intermediate calisthenics enthusiast),
  why-now, random-Tuesday, monetization hypothesis (annual-forward sub, frequency-fit
  caveat noted).
- Stage 2 market check: 5 real competitors mined from live App Store listings
  (GOLDEN Bars, RepSquad, Pull Ups Counter, PoseTracker AI, push-up cluster), review
  mining, ASO landscape, differentiation/4.3 defense, honest "reasons not to build."
- Pose-feasibility spike: on-device Vision validated on well-framed pull-ups (go);
  founder-footage run surfaced capture-UX as a v1 requirement (PARTIAL for impromptu).
