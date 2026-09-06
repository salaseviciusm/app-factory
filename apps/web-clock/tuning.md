# Tuning the detectors on real footage

The detectors ship with thresholds from the pullup spike (two stock clips) and geometry
from a synthetic athlete. They have never seen you, your bar, or your floor. This is the
loop that fixes that — before release, and again after every retune.

## 1. What to film (tomorrow)

Film with the phone **propped, not held**, exactly as a user would: on a shelf, a chair,
or leaning on a bottle, roughly hip height, 2–3 m away, portrait. Face the phone
(front/¾). The clips from the pullup spike showed that rear views kill the nose signal
and floor-level worm's-eye angles halve tracking — so the point is to film the placement
we will tell users to use, and find out what breaks.

| Clip | Length | What | Why |
|---|---|---|---|
| `pullups-rx.mov` | 5–10 strict reps, count aloud | pull-ups, dead hang to chin over | elbow-angle thresholds, chin rule |
| `pullups-jumping.mov` | 5–10 jumping reps | scaled variant | jumping thresholds (start angle is lower) |
| `pushups-rx.mov` | 10 reps, side-on to the phone | push-ups | lockout / depth thresholds |
| `pushups-knee.mov` | 10 reps | knee variant | knee thresholds |
| `squats.mov` | 15 reps, ¾ view | air squats | knee angle + hip-below-knee rule |
| `partials.mov` | a few deliberately short reps of each | half pull, shallow push-up, high squat | every reject reason must fire |
| `transitions.mov` | bar → floor → stand, no reps | the moves between sets | transition guard length |
| `cindy-full.mov` | one real 20:00 | everything, with fatigue and drift | the only test that matters |

Say the count out loud on camera; the audio is the ground truth for `counted`.

## 2. Footage → fixture

On the Mac (Xcode installed):

```sh
cd apps/web-clock/app
xcrun swiftc -O tools/pose-extract.swift -o /tmp/pose-extract
/tmp/pose-extract ~/footage/pullups-rx.mov > /tmp/pullups-rx.csv
node tools/csv-to-fixture.mjs /tmp/pullups-rx.csv fixtures/pullup/founder-rx-01.json \
  --label "founder, garden bar, phone on chair 2.5 m, front"
```

Then write what you did into the golden:

```sh
cat > fixtures/pullup/founder-rx-01.expect.json <<'EOF'
{ "counted": 8, "maxRejects": 1, "note": "8 strict; rep 6 was a grinder" }
EOF
npm test
```

Fixtures hold keypoints only. Commit them. Never commit the `.mov`.

## 2a. Mixed clips (IMG_1159 / IMG_1158 / IMG_1151)

The first footage is three general-workout clips — push-ups, pull-ups, burpees, back rows,
no Cindy. That is fine, and in one way better: rows and burpees are exactly the movements
the detectors must *not* count. Workflow, on the Mac, from `apps/web-clock/app`:

```sh
xcrun swiftc -O tools/pose-extract.swift -o /tmp/pose-extract
for n in 1159 1158 1151; do
  /tmp/pose-extract ~/Downloads/IMG_$n.MOV > /tmp/img-$n.csv      # stderr prints "size WxH"
  node tools/csv-to-fixture.mjs /tmp/img-$n.csv /tmp/img-$n.json --size 1080x1920
  npm run scan -- /tmp/img-$n.json --bucket 2 > /tmp/img-$n.scan.txt
done
```

Use the `--size` the extractor printed (portrait iPhone video is usually `1080x1920`;
4K is `2160x3840`). Whole-clip fixtures stay in `/tmp` — they are too long to be goldens.

`scan` prints three things per clip:

1. **A timeline** in 2 s buckets: `classifyPosture` (`hang` / `stand` / `plank` /
   `supine` / `unknown`), joint coverage, mean elbow and knee angle, hip-below-knee,
   wrist-above-shoulder in torso-lengths. `plank` + oscillating elbow = push-ups (or
   the push-up half of a burpee); `hang` = on the bar; `supine` + oscillating elbow =
   inverted rows; `stand` + oscillating knee = squats.
2. **Every count/reject from every detector** across the whole clip, with timestamps.
   Watch the video at those timestamps. A pull-up or push-up count during rows is a
   gate failure. A push-up count during a burpee is a judgment call.
3. **Suggested `--from/--to` windows** where a detector counted a burst of reps.

Then cut snippets. Positive ones go under the move, negatives under `negative/`:

```sh
node tools/csv-to-fixture.mjs /tmp/img-1159.csv fixtures/pushup/founder-mixed-01.json \
  --from 42 --to 71 --size 1080x1920 --label "IMG_1159 0:42–1:11, push-ups, phone on floor, side"
echo '{ "counted": 12, "maxRejects": 2, "note": "counted aloud from the video" }' \
  > fixtures/pushup/founder-mixed-01.expect.json

node tools/csv-to-fixture.mjs /tmp/img-1158.csv fixtures/negative/founder-rows-1158.json \
  --from 130 --to 165 --size 1080x1920 --label "IMG_1158 2:10–2:45, inverted rows"
echo '{ "maxCounted": { "pullup": 0, "pushup": 0, "squat": 0, "row": 8 }, "note": "Cindy 0" }' \
  > fixtures/negative/founder-rows-1158.expect.json

npm test
```

Cut each window with **3 s of stillness before the first rep** when the footage has it —
the detectors need to see the start position (hang / lockout / standing) before they arm,
which is why clip A from the spike counts 2 of its 3 visible tops.

Snippets already cut from these clips:

| Fixture | Source | Window | What it settles |
|---|---|---|---|
| `negative/founder-rows-1151` | IMG_1151 | 0:52–1:12 | Inverted rows must not count as Cindy moves |
| `negative/founder-rows-1158` | IMG_1158 | 2:10–2:45 | Same, second body position |
| `row/founder-1151` | IMG_1151 | 0:52–1:12 | Row detector may count (currently undercounts) |
| `pushup/founder-incline-1151` | IMG_1151 | 0:20–0:46 | Incline on the low handles ≠ floor Rx |
| `squat/founder-1158` | IMG_1158 | 0:07–0:34 | Air squats, phone on the floor |
| `pullup/founder-rear-1159` | IMG_1159 | 4:00–4:20 | Rear bent-knee pull-ups (`hang-short` on the tuck) |

What these clips can and cannot settle:

- **Can:** the posture gate (rows ≠ push-ups ≠ pull-ups); elbow/knee thresholds on this
  body and this patio; incline vs floor Rx; rear-view pull-ups; squat depth from the floor.
- **Cannot:** floor Rx push-ups, front/¾ dead-hang pull-ups, the transition guard, or a
  20:00 under fatigue. Those still need the table in §1. Dips and burpees in 1158 have
  no detector yet.

The posture gate (`src/domain/pose/posture.ts`) is what stopped the 1151 row window
counting as ~18 pull-ups and ~19 push-ups. At the top of a row the shoulders rise to
the bar and the classifier flips `supine` → `plank`; `PostureArm` holds the row
detector through that once a cycle has started. Do not loosen Cindy thresholds to
chase leftover misses — those are lockout (`startAbove`) or a later retune.

Posture features (relative, not pixels):

| Feature | Meaning | Gate |
|---|---|---|
| `torsoTilt` | 0° = image-vertical, 90° = horizontal | upright < 48°, horizontal > 55° |
| `wristAboveShoulder` | wrists toward the top of the frame, in torso-lengths | hang ≥ 0.22; supine ≥ 0.18 |
| `torsoFraction` | torso length / visible body box | < 0.22 + wrists up = foreshortened row, not hang |

Hips missing (common on rear / floor cameras): wrists above shoulders → hang. Do not
invent a torso fraction — that misfires as a row and killed the spike's clip A.

## 2b. More camera angles — 3D project, not AI video

The engine must not overfit the patio floor placement. The cheap way to get other
angles is a 3D stick figure in metres (`athleteAt` in `src/domain/pose/project.ts`)
projected through `CAMERAS`:

`front-hip`, `front-floor`, `side-hip`, `side-floor`, `rear-hip`, `three-quarter`.

`tests/posture.test.ts` requires the intended detector to count, and the others to
stay at zero, on every camera except `rear-hip` + push-up (filming a plank from the
head looks like a stand — a framing fail; do not retune thresholds to pass it). A
spine-on row (front-floor / rear) is `supine` from stacked hips, not a hang.

**Do not generate goldens from AI video** of the reference clips. Vision run on
invented limbs describes the generator, not the athlete; a hallucinated elbow angle
becomes a false threshold. If we want other angles of the *same* activity later:

1. Add a camera to `CAMERAS` and extend the multi-view test (same 3D athlete).
2. Or film a real clip from that placement and cut a fixture (§2).

AI video is still useful for listing / ASO / demo footage, where the pixels are the
product. It is not a golden source.

The live framing gate still wants ~75% of required joints. Founder floor placement
often sits at 40–70% coverage and may refuse to start a session. That is a separate
cue, not a detector threshold.

## 2c. Debug videos (skip-hero loop)

Same pipeline as skip-hero: pose fixture → detector trace → annotated `.debug.mov`.
The source clip is never modified. From `apps/web-clock/app`:

```sh
npm run debug-video -- ~/Downloads/IMG_1151.MOV 30
# reuses /tmp/img-1151.json when present
npm run debug-video -- ~/Downloads/IMG_1158.MOV 20 --from 7 --to 40
```

Writes `<video>.debug.mov` and `<video>.debug-preview.png` next to the input (or
`--out`). HUD: posture, all four detector counts/phases, count/reject flashes,
elbow + knee strip. Delete the `.trace.json` after a retune.

## 3. Reading a failure

`tests/goldens.test.ts` says how many reps counted vs how many you did. To see why, dump
the signal (this is what tuned the current numbers on clips A/B):

```ts
// in a scratch test: print smoothed elbow/knee angle per frame
import { elbowAngle } from '../src/domain/detectors/pullup-detector.js';
frames.forEach((f, i) => console.log(i, elbowAngle(f, 'left')?.angle, elbowAngle(f, 'right')?.angle));
```

Compare against the thresholds in `src/domain/detectors/*-detector.ts`:

| Move | start (≥) | attempt (≤) | end (≤) | count at |
|---|---|---|---|---|
| pull-up rx | 150° | 120° | 75° | leaving the top |
| pull-up jumping | 120° | 105° | 80° | leaving the top |
| push-up rx | 150° | 130° | 95° | return to lockout |
| push-up knee | 150° | 135° | 105° | return to lockout |
| squat rx | 160° | 140° | 100° + hip ≤ knee | standing up |
| squat box | 160° | 145° | 120° | standing up |
| row rx | 150° | 130° | 95° | return to long-arm (gate holds through plank at the top) |

Typical fixes, in order of likelihood:

1. **Undercount, no rejects** → the start threshold is too strict for your lockout / hang
   (your elbows never read 150°). Lower `startAbove` by 5–10°.
2. **Undercount with `hang-short` / `depth-short`** → the end threshold is too deep for the
   camera angle (2D projection compresses angles off-axis). Raise `endBelow`.
3. **Overcount** → the transition motion is being read as a rep. Check `transitions.mov`;
   raise `TRANSITION_GUARD_MS` in `director.ts` or `minRepMs` in the thresholds.
4. **`chin-below-bar` on clean reps** → `CHIN_MARGIN` in `pullup-detector.ts`; the nose sits
   higher than the wrist line by less than expected at your bar height.
5. **Flicker at the top** → `smoothing` down (0.6 → 0.4) adds lag but kills double-counts.

Cindy detectors are already `v2` (the posture-arm bump). Bump again (`v2` → `v3`)
whenever thresholds change after a build has shipped: history keeps the detector that
counted each rep. Row is still `row-rx-v1`.

## 4. Shipping a retune

Thresholds are JavaScript. After the store build is live:

```sh
npm run check
npx eas update --channel production --message "retune: pullup rx start 150→142 after founder footage"
```

Native module changes (Swift) need `eas build`.

## 5. Live checks that need the phone, not fixtures

- Front camera mirroring: the overlay skeleton must sit on your body, not mirrored.
- Rotation: portrait buffers (`videoRotationAngle = 90`); if the skeleton is sideways, the
  connection did not accept the angle on that device.
- Frame rate: the HUD overlay should feel ~30 fps; if Vision drops it, set `fps: 24` in
  `LivePoseSource.start`.
- Thermal: a full 20:00 with Vision at 30 fps warms the phone; check it does not throttle
  into missed reps in the last five minutes.
