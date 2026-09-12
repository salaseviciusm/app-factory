// One-shot: print classifyPosture on sim poses and founder windows so thresholds
// can be set from evidence, not a guess.
import { readFileSync } from 'node:fs';
import { classifyPosture } from '../src/domain/pose/posture.js';
import { fixtureFrames, type PoseFixture } from '../src/domain/pose/fixture.js';
import { simPoseAt } from '../src/domain/pose/sim-pose.js';
import type { Move } from '../src/domain/detectors/detector.js';

function dump(label: string, frames: ReturnType<typeof fixtureFrames>, every = 15) {
  const counts = new Map<string, number>();
  for (const f of frames) {
    const { posture } = classifyPosture(f);
    counts.set(posture, (counts.get(posture) ?? 0) + 1);
  }
  const summary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${p}:${n}`)
    .join('  ');
  console.log(`\n${label}  (${frames.length} frames)  ${summary}`);
  for (let i = 0; i < frames.length; i += every) {
    const f = frames[i];
    if (!f) continue;
    const { posture, features } = classifyPosture(f);
    const t = (f.tMs / 1000).toFixed(1).padStart(6);
    const tilt =
      features.torsoTilt === undefined ? '  -  ' : `${features.torsoTilt.toFixed(0)}°`.padStart(5);
    const wr =
      features.wristAboveShoulder === undefined
        ? '   -  '
        : features.wristAboveShoulder.toFixed(2).padStart(6);
    console.log(`  ${t}s  ${posture.padEnd(8)} tilt ${tilt}  wrist↑ ${wr}`);
  }
}

const moves: Move[] = ['pullup', 'pushup', 'squat', 'row'];
console.log('sim poses (depth 0 / 0.5 / 1)');
for (const move of moves) {
  for (const d of [0, 0.5, 1]) {
    const { posture, features } = classifyPosture(simPoseAt(move, d));
    console.log(
      `  ${move.padEnd(7)} d=${d}  ${posture.padEnd(8)} tilt ${features.torsoTilt?.toFixed(0)}  wrist↑ ${features.wristAboveShoulder?.toFixed(2)}`,
    );
  }
}

function load(path: string) {
  return fixtureFrames(JSON.parse(readFileSync(path, 'utf8')) as PoseFixture);
}

function window(frames: ReturnType<typeof fixtureFrames>, fromSec: number, toSec: number) {
  return frames.filter((f) => f.tMs / 1000 >= fromSec && f.tMs / 1000 <= toSec);
}

for (const [path, slices] of [
  [
    '/tmp/img-1151.json',
    [
      ['1151 setup', 0, 18],
      ['1151 incline push-ups', 20, 46],
      ['1151 rows', 52, 70],
    ],
  ],
  [
    '/tmp/img-1158.json',
    [
      ['1158 squats', 7, 34],
      ['1158 incline push-ups', 40, 80],
      ['1158 rows', 130, 165],
      ['1158 rows 2', 450, 480],
    ],
  ],
  [
    '/tmp/img-1159.json',
    [
      ['1159 pull-ups 1', 4, 76],
      ['1159 empty rack', 80, 200],
      ['1159 pull-ups 2', 240, 260],
    ],
  ],
] as const) {
  try {
    const frames = load(path);
    for (const [label, from, to] of slices) {
      dump(label, window(frames, from, to), 20);
    }
  } catch (err) {
    console.log(`skip ${path}: ${(err as Error).message}`);
  }
}
