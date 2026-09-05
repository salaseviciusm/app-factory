# Decision Log — web-clock

Proposed until the founder gate. Format per the factory log.

## P1 — Public name is Web Clock, not Spider-Man (2026-09-05)

**Context:** Founder spark used “Spiderman workout.” The reference short is
built around Holland / Brand New Day imagery.
**Decision (proposed):** Store name, icon, and copy use Web Clock / 5-10-15 /
AMRAP. No Marvel or performer names.
**Why:** Trademark rejection and Apple 4.3 (film IP as a skin). Ownable brand
plus a category suffix is the ASO playbook pattern.

## P2 — v1 workout is Cindy Rx, not the one-legged drill (2026-09-05)

**Context:** The short is a collage; the founder asked for reps + a timer.
**Decision (proposed):** Track 20:00 AMRAP, 5 pull-ups / 10 push-ups / 15 air
squats. Add the one-legged move only after raw footage says that is the thing.
**Why:** That circuit is the only reading that needs both a clock and a
per-move count, and it is skip-hero’s pipeline with three detectors.

## P3 — Skip the hero splash (2026-09-05)

**Context:** Founder: “skip hero.”
**Decision (proposed):** `onboarding.enabled = false`. First open is the
framing gate. “Skip-hero” also means the Vision pipeline, not the jump-rope
screens.
**Why:** UX playbook — onboarding earns each screen. A carousel does not.

## P4 — Fork the skip-hero pipeline pattern, not the repo (2026-09-05)

**Context:** skip-hero is not in this workspace; pullup already recorded the
fork instruction.
**Decision (proposed):** Event-sourced core, pose seam, versioned detectors,
Cells for live pose, fixture replay. New HUD and new detectors. No Tile Rush,
no cyan nocturne clone.
**Why:** D6 (reuse where possible) and 4.3 (forks must be differentiated).

## P5 — Direction D: the 30-day challenge, named Suit Up (2026-09-05)

**Context:** Four listing directions were boarded (`directions.md`): A Twenty
(benchmark), B Rooftop (27-round challenge), C Strict (camera as judge), D Round
One (30 days, scaled). The pre-decision recommendation was B. Founder picked D,
and asked to fold in the lock-in-season and hero-workout angles for marketing.
**Decision (proposed):** Ship D. Working name **Suit Up**; title `Suit Up: 30-Day
Hero Workout`; subtitle `The camera counts. Lock in.` The store face is the
challenge and the calendar; the hero-workout reference is content-only. This
supersedes P1's public name (Web Clock) — the IP rule in P1 stands.
**Why:** Store data after the pick: the "lock in" lane is proven and recent
(Lock In 26,542 ratings since 2025-06; LOCKED 5,056; 75 Days Challenge 8,662; Her
75 4,993) and every entrant is a checkbox tracker. A fixed-length challenge whose
proof is the camera is a wedge none of them can copy with a copy change. D also
widens the audience to beginners via scaled variants, which B did not.

## P6 — Winter Arc cohort on Oct 1; scaled detectors are the scope lever (2026-09-05)

**Context:** Lock-in / winter-arc convention starts Oct 1. Four extra detectors
(jumping pull-up, knee push-up, box squat, plus tuning) compete with that date.
**Decision (proposed):** Cohort date Oct 1 as an in-app event. If scaled
detectors are not golden-tested by then, v1 ships Rx detectors plus a manual
scaled mode (`rep-added-manually`), and the card labels those sessions "manual".
Manual-only sessions record but do not light a calendar day.
**Why:** A challenge cohort that starts late into the season loses the hook; a
challenge whose day-lighting can be faked loses the wedge. Both must hold.

## P7 — Free calendar, paid history (2026-09-05)

**Decision (proposed):** Live count, today's card, and the 30-day calendar are
free. Pro: history across arcs, PBs, replay export, extra targets. No hard
paywall until the *reprice* outcome fires (`market-check.md` §6).
**Why:** A challenge whose proof sits behind a paywall produces no shared cards
and no clean view → install → D7 read. The pilot exists to get that read.

## P8 — The native module owns the camera; no expo-camera (2026-09-05)

**Context:** `architecture.md` §3 drew expo-camera feeding pixel buffers to the
Vision module. Expo's camera does not expose buffers without a frame-processor
library and a worklets runtime.
**Decision (proposed):** `AppleVisionPose` runs its own `AVCaptureSession` and
exports a `PosePreviewView` on the same session. Frames never cross the bridge;
only a 19-joint `PoseFrame` does, at ≤ 30 fps.
**Why:** One Swift file replaces two dependencies and a JSI thread. Latest-wins
frame dropping and orientation/mirroring live where the buffers are.

## P9 — 2D pose only in v1; the chin rule is geometric (2026-09-05)

**Context:** §10 kept the 3D request for pull-ups. Spike 002 recorded that 3D
hips/root are templated and the request is slower.
**Decision (proposed):** `VNDetectHumanBodyPoseRequest` only. Chin-over-bar is
`nose.y` against the wrist line with a margin. Revisit after founder footage.
**Why:** Elbow angle is the rep signal in both spike clips; 3D would buy nothing
the goldens can measure yet, and costs frame rate on a 20-minute session.

## P10 — Transition guard in the director, 1.5 s (2026-09-05)

**Context:** The director tests counted phantom reps when the synthetic athlete
moved from the bar to the floor: the joint swing crosses every threshold once.
**Decision (proposed):** After `set-completed` the director drops detector
output for `TRANSITION_GUARD_MS = 1500`. The value is a tuning knob; the
`transitions.mov` clip in `tuning.md` exists to set it.
**Why:** The alternative — a "settle" state each detector must reach — moves
the same guard into six detectors and hides it from tuning.

## P11 — Ship with everything unlocked; entitlement seam only (2026-09-05)

**Context:** P7 defers the paywall. RevenueCat is a Rank 0 task and needs an
App Store Connect product before it can be tested.
**Decision (proposed):** `GrantAllEntitlements` in the store build. History and
PBs are visible. No purchase UI. The `Entitlements` seam stays in the context.
**Why:** A review build with a paywall that cannot be exercised is a 2.1
rejection risk for nothing; the pilot's read (P7) does not need the gate.

## P12 — Store copy is the ASO brief, verbatim (2026-09-05)

**Decision (proposed):** `store/metadata/en-US/*` is copied from `aso.md`, not
re-written. Review notes state on-device processing, no account, no purchases,
and how to test without a pull-up bar (arms overhead with a full elbow bend
reads as a pull-up; "+1" always works). The sim source is `__DEV__`-only and is
not in the store build.
**Why:** One source of truth for the listing; the checklist item is "paste",
not "write".
