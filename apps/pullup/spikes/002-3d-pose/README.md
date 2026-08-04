# Spike 002 — 3D body pose for bad camera angles (Apple Vision `VNDetectHumanBodyPose3DRequest`)

Throwaway feasibility spike. Not production code. Follows the `spike` skill loop.

## Verdict: VALIDATED

**Question:** Does Apple's **3D** body pose (`VNDetectHumanBodyPose3DRequest`, macOS 14+)
track a pull-up and yield usable metrics at the *bad* real-world angles where the 2D
request (`VNDetectHumanBodyPoseRequest`, spike 001) failed — specifically **from behind
(face not visible)** and **low/worm's-eye**? Concretely: (a) does it still produce a
skeleton from behind, (b) does it give a usable 3D **elbow angle** (shoulder–elbow–wrist),
and (c) does it support a **chin-over-bar analog that does NOT need the face**?

**Evidence:** A ~150-line Swift CLI (`pose3dspike.swift`, AVFoundation decode + Vision
3D request per frame, on-device, no network) run over the founder's real rear/low clip
plus a front-on baseline and an extreme worm's-eye clip. Analyzed with a pure-stdlib
Python script (`analyze3d.py`). Exact commands:

```bash
xcrun swiftc -O pose3dspike.swift -o pose3dspike
# THE failing case (founder, filmed from behind, low angle), sampled every 3rd frame, 0–120s:
./pose3dspike input/rearview_pullups.mov  3 up 120 > rear_dense.csv
./pose3dspike input/fronton_stock_pullups.mp4 3 up    > front.csv   # clean baseline
./pose3dspike input/wormseye_pushups.mp4      3 up    > worm.csv    # extreme angle, diff exercise
python3 analyze3d.py rear_dense.csv
```

### Measured numbers

**THE failing case — `rearview_pullups.mov` (founder, from directly behind, worm's-eye,
face fully hidden — see `rear_28s.png`, `rear_34s.png`):**

| Signal | **2D (spike 001)** | **3D (this spike)** |
|---|---|---|
| Face joint for chin-over-bar | nose tracked **3.6%** of frames → metric dead | **head present in 100% of tracked frames** (from behind) |
| Frames with usable skeleton | usable-wrist 44–61% | **76.2%** over 0–120s · **87.1%** in the 22–70s rep bouts |
| Frames with usable **3D elbow angle** | (≈ wrist availability) | **76.2% / 87.1%** — **100% of every tracked frame** |
| Chin-over-bar metric | **needs the face → fails** | **face-independent** `head.y` vs mean `wrist.y`, computable in **100% of tracked frames** |
| Elbow-angle span observed | — | **48.8° → 168.7°** (119.9° range; near-straight dead-hang now captured) |
| Head-vs-hands proxy span | — | **−0.76 m … +0.48 m** (clear hang↔top swing) |
| Reps auto-segmented (proxy minima) | — | 7 clean reps in the 22–70s bout (drops 0.61–0.93 m) |

Head tracking from behind is **real, not a template**: across 915 tracked rear-view frames
`head_y` swept **0.086 → 0.676 m (0.59 m span)** and `lWri_y` swept **1.53 m** — the model
infers head/shoulder/elbow/wrist positions from the **back of the body**, no face required.

**Front-on baseline — `fronton_stock_pullups.mp4`:** 91.8% skeleton, **100% usable elbow
angle**, 3 reps auto-detected (proxy drops 0.28–0.38 m), matching spike 001's 3-rep result.

**Stress test (step 4) — extreme worm's-eye, `wormseye_pushups.mp4`:** at a brutal
ground-up angle on a *different* exercise, 3D tracking **survives at 76.7%** of frames —
it does not collapse.

### What worked
- **From behind, face hidden, the skeleton survives.** 76–87% usable-skeleton rate on the
  exact clip where 2D's nose died at 3.6%. The upper-body chain (head, shoulders, elbows,
  wrists) is fully tracked from the back.
- **Face-independent chin-over-bar is real.** `head.y − wrist.y` in 3D is computable in
  **100% of tracked frames** and swings cleanly hang↔top — this removes the face-forward
  requirement that killed the 2D nose metric.
- **3D elbow angle is available in every tracked frame** and, from behind, captured a wider
  ROM (up to 168.7°, near-straight dead-hang) than the front-on stock clip did.

### What failed or surprised us (be honest)
- **Lower body is templated, not tracked.** `root` and both hips sit at a fixed origin
  (`y = 0.000` in every frame) — the API's per-joint `position` is relative to root and the
  legs/hips carry no independent signal here. Fine for pull-ups (we already "ignore hips"
  from spike 001), but 3D is **not** a free lower-body tracker.
- **Absolute overhead arm pose is compressed.** In the front-on stock clip the elbow never
  read straighter than ~133° at dead-hang (arms fully overhead), so raw 3D angles are **not
  yet calibrated for form scoring** — but the *differential* (head rising toward hands, elbow
  flexing/extending) is clean and monotonic, which is what rep detection needs.
- **Naïve rep segmentation over-counts.** My crude proxy-minima detector found 25 "reps"
  across the full 120s because it also fires on the later push-up/rest motion. Rep counting
  needs a real state machine + the known bar position, not a threshold — a tuning task, not a
  tracking failure.
- ~24% of rear frames returned **no observation** (subject partially out of the low frame,
  transitions). Usable, but a production app needs an in-frame guide + gap interpolation.

**Recommendation: GO — adopt `VNDetectHumanBodyPose3DRequest` to widen angle tolerance.**
3D projects well at the exact angles that broke 2D and **removes the face-forward
requirement**: it produces a usable skeleton, a usable 3D elbow angle, and a face-independent
chin-over-bar proxy from directly behind at a worm's-eye angle, where 2D's nose-based metric
was dead (3.6%).

Concrete next production steps:
1. **Rebuild the core metrics on 3D**: elbow angle for ROM + `head.y` vs mean `wrist.y` as the
   face-independent chin-over-bar gate. Drop the nose dependency entirely.
2. **Calibrate against ground truth** (a few tagged reps) so raw 3D angles map to real
   flexion for form scoring — the differential is trustworthy, the absolute is not yet.
3. **Rep state machine, not a threshold**, keyed on the wrist/bar plane; don't count on the
   descent-motion of other exercises.
4. **Gate on upper body only** (head/shoulder/elbow/wrist); ignore hips/legs (templated).
5. **Validate live** on `AVCaptureSession` at device frame rate (this spike decoded files;
   3D inference was GPU-bound and slow over long clips — confirm real-time budget) with an
   in-frame framing guide to recover the ~24% no-observation gap.

## Files
- `pose3dspike.swift` — Swift CLI: AVFoundation decode + `VNDetectHumanBodyPose3DRequest` per frame → CSV of 3D joint positions (meters, relative to root).
- `analyze3d.py` — pure-stdlib analyzer: 3D elbow angle, face-independent head-vs-wrist proxy, rep segmentation, ROM.
- `extractframe.swift` — dumps PNG stills for visual angle confirmation.
- `rear_dense.csv` / `rear_win.csv` / `front.csv` / `worm.csv` — per-frame 3D joint data.
- `rear_28s.png`, `rear_34s.png` — from-behind, worm's-eye, face-hidden frames (the failing case).
- `input/` — the three clips (gitignored; not committed).

## Reproduce
`xcrun swiftc -O pose3dspike.swift -o pose3dspike && ./pose3dspike input/rearview_pullups.mov 3 up 120 > rear_dense.csv && python3 analyze3d.py rear_dense.csv`
