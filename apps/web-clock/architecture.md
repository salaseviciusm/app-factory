# web-clock — Architecture

Visual board: `canvases/infra.html`. This file is the template delta the
tech-lead would formalize after stamp. Nothing here is implemented.

## Delta on the template

**Configuration only:** brand pack tokens/identity, `features.onboarding.enabled
= false`, analytics event names, freemium entitlement `pro`.

**Custom code:**

| Where | What |
|---|---|
| `app/src/domain/` | Platform-free events, WorkoutDirector, detectors, score projections |
| `app/modules/apple-vision-pose/` | Expo native module · Vision 2D + 3D |
| `app/src/impl/pose-source-*.ts` | Live / simulated / fixture adapters |
| `app/tools/pose-extract.swift` | Offline video → `recording.json` (Mac) |
| `app/fixtures/` | Committed pose tapes + goldens |

**Not custom:** event bus/store, entitlements seam, analytics seam, Cell,
stamp script. Do not vendor a full Expo app into `template/` (ADR 0003).

## Pipeline

```
expo-camera
  → AppleVisionPoseModule (VNDetectHumanBodyPoseRequest
                          + VNDetectHumanBodyPose3DRequest)
  → PoseFrame   (canonical; vendor types stop here)
  → PoseSource  (live | sim | fixture)
  → FramingGate + WorkoutDirector + AmrapClock     [Cells]
  → domain events on the bus                       [durable]
  → projections (SessionDetail, ScoreHistory, PB)
```

Frames never go on the bus. Detector outputs carry a version string
(`pullup-v1`, `pushup-v1`, `squat-v1`). Old versions freeze; retunes ship as
`v2`.

## Pose dimensionality

From pullup spikes, folded in:

- Pull-ups: 3D elbow angle + face-independent `head.y` vs mean `wrist.y`.
  Ignore hips. Ignore nose.
- Push-ups: 2D elbow angle, averaged; plank line as a cheat gate.
- Squats: **2D only** for hips/knees. Spike 002: 3D hips/root are templated at
  the origin and carry no independent signal.
- Framing is a v1 feature. Undercount when unsure.

## Composition root

`src/context/app-context.ts` is the only `new`. Pose implementation is selected
by `EXPO_PUBLIC_POSE=live|sim|fixture`. Swapping Vision for a later Android
source is one adapter file plus one line.

## Storage

v0: `InMemoryEventStore` (ships in src). Next: SQLite adapter, same two-method
store. Do not invent a mutable session table.

## Factory placement

After stamp, addressable as quickfire rig `factory:web-clock` under
`orchestration/rigs.json` `factoryApps`. Checks: `npm run check`. No EAS until
promoted. This environment cannot run `factory-run`; boards live in the spec
repo until the founder says go.

## Explicit non-goals

Hero splash. Cloud pose. skip-hero screens/Tile Rush. Marvel surfaces.
Leaderboards. Android MediaPipe. A tap-only Cindy MVP.
