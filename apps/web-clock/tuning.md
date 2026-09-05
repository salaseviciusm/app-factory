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

Bump the detector `id` (`pullup-rx-v1` → `v2`) whenever thresholds change after a build has
shipped: history keeps the detector that counted each rep.

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
