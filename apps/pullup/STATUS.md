# Status — pullup

> Kept truthful by the chief of staff; verified against git/session records.

- **Stage:** 2 complete + feasibility spikes (2D **and** 3D) delivered. **ON HOLD — founder
  paused the idea at the spec gate 2026-08-03 09:20.** Do not advance to Stage 3+ (brand/
  design/architecture) until the founder un-pauses.
- **Last updated:** 2026-08-03 09:20 (founder hold)
- **Last verified:** 2026-08-05 18:00 (EOD sync) — still accurate. No pullup runs in
  `factory-run list`, no subagents, no commits touching `apps/pullup/` since `1e98a1d`
  (2026-08-04, which tracked the existing artifacts in git). Hold unchanged for 2 days.

## HOLD (2026-08-03)

Founder: "Nah hold off on this idea" — replying to the Monday standup's pullup spec-gate ask.
Pullup is **paused**, not killed. All artifacts (spec.md, market-notes.md, spikes/001 2D +
spikes/002 3D verdicts, decisions.md) remain on disk as a dated, resumable evidence pack —
resume from the spec gate whenever. No further build work; no Stage 3–4 dispatch.

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

Not hard-blocked, but **two founder dependencies** before build — both **parked, not
pending**, since the 2026-08-03 hold. Nothing here is waiting on an answer today; they
become live again only if the founder un-pauses the app:
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
