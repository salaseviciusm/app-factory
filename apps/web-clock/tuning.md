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

1. **A timeline** in 2 s buckets: posture guess (`hang` / `plank` / `stand` / `bent`),
   joint coverage, mean elbow and knee angle, hip-below-knee, nose-above-wrist. `plank`
   with the elbow oscillating = push-ups (or the push-up half of a burpee); `hang` = on
   the bar; `bent` with the elbow oscillating = rows.
2. **Every count/reject from every detector** across the whole clip, with timestamps.
   Watch the video at those timestamps. A pull-up count during rows is a false positive
   to fix; a push-up count during a burpee is arguably correct and a judgment call.
3. **Suggested `--from/--to` windows** where a detector counted a burst of reps.

Then cut snippets. Positive ones go under the move, negatives under `negative/`:

```sh
node tools/csv-to-fixture.mjs /tmp/img-1159.csv fixtures/pushup/founder-mixed-01.json \
  --from 42 --to 71 --size 1080x1920 --label "IMG_1159 0:42–1:11, push-ups, phone on floor, side"
echo '{ "counted": 12, "maxRejects": 2, "note": "counted aloud from the video" }' \
  > fixtures/pushup/founder-mixed-01.expect.json

node tools/csv-to-fixture.mjs /tmp/img-1158.csv fixtures/negative/rows-01.json \
  --from 130 --to 165 --size 1080x1920 --label "IMG_1158 2:10–2:45, bent-over rows"
echo '{ "maxCounted": { "pullup": 0, "pushup": 0, "squat": 0 }, "note": "rows must not count" }' \
  > fixtures/negative/rows-01.expect.json

npm test
```

Cut each window with **3 s of stillness before the first rep** when the footage has it —
the detectors need to see the start position (hang / lockout / standing) before they arm,
which is why clip A from the spike counts 2 of its 3 visible tops.

What these clips can and cannot settle:

- **Can:** elbow-angle thresholds for push-ups and pull-ups on your body and your camera
  placement; whether the chin rule and the `too-close` gate fire wrongly; how rows and
  burpees look to each detector (negative goldens); which reject reasons fire on grinders.
- **Cannot:** squat thresholds (no squats in the clips — film `squats.mov`), the transition
  guard length, or anything about a 20:00 under fatigue. Those still need the table in §1.

Known cross-talk to expect in the scan: the push-up detector counts pull-ups (both are
elbow-angle cycles; on the spike's clip B it counts 2 of 3). In the app only the active
set's detector runs, so this is not a bug on its own — but if the negatives show the
pull-up detector counting rows, the fix is a posture gate (wrists above shoulders for
pull-ups; torso near horizontal for push-ups), not a threshold change.

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
