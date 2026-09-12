// scan.ts — read a whole-clip fixture and print a timeline so you can find the snippets
// worth cutting (push-ups at 0:42–1:10, pull-ups at 3:05–3:40 …) and see what every
// detector does across the whole clip, including the movements it should ignore.
//
//   npm run scan -- /tmp/img-1159.json            # 1 s buckets
//   npm run scan -- /tmp/img-1159.json --bucket 2 # 2 s buckets
//
// Columns: classifyPosture (hang / stand / plank / supine / unknown), joint coverage,
// mean elbow, mean knee, hip–knee dy (positive = hips below knees), wrist-above-shoulder
// in torso-lengths. Then every rep counted or rejected by each detector (incl. row),
// then suggested --from/--to windows per movement.
import { readFileSync } from 'node:fs';
import { createDetector } from '../src/domain/detectors/index.js';
import {
  MOVES,
  RX_PLAN,
  SCALED_PLAN,
  type Detector,
  type Move,
  type VariantPlan,
} from '../src/domain/detectors/detector.js';
import { elbowAngle } from '../src/domain/detectors/pullup-detector.js';
import { kneeAngle } from '../src/domain/detectors/squat-detector.js';
import { fixtureFrames, type PoseFixture } from '../src/domain/pose/fixture.js';
import { classifyPosture } from '../src/domain/pose/posture.js';
import { JOINTS, joint, meanDefined, type PoseFrame } from '../src/domain/pose/pose-frame.js';

const [, , input, ...rest] = process.argv;
if (!input) {
  console.error('usage: scan <fixture.json> [--bucket seconds] [--plan rx|scaled]');
  process.exit(2);
}
const option = (name: string): string | undefined => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};
const bucketSec = Number(option('--bucket') ?? 1);
const plan: VariantPlan = option('--plan') === 'scaled' ? SCALED_PLAN : RX_PLAN;

const fixture = JSON.parse(readFileSync(input, 'utf8')) as PoseFixture;
const frames = fixtureFrames(fixture);
const durationSec = (frames.at(-1)?.tMs ?? 0) / 1000;
console.log(
  `${fixture.source}${fixture.label ? ` — ${fixture.label}` : ''}: ${frames.length} frames, ${durationSec.toFixed(1)} s, ${fixture.width}x${fixture.height}`,
);

interface Sample {
  posture: string;
  coverage: number;
  elbow?: number;
  knee?: number;
  hipKneeDy?: number;
  wristAbove?: number;
}

function sample(frame: PoseFrame): Sample {
  const seen = JOINTS.filter((name) => joint(frame, name) !== undefined).length;
  const hip = mid(frame, 'leftHip', 'rightHip');
  const knee = mid(frame, 'leftKnee', 'rightKnee');
  const classified = classifyPosture(frame);
  const elbow = meanDefined([elbowAngle(frame, 'left')?.angle, elbowAngle(frame, 'right')?.angle]);
  const kneeA = meanDefined([kneeAngle(frame, 'left')?.angle, kneeAngle(frame, 'right')?.angle]);
  return {
    posture: classified.posture,
    coverage: seen / JOINTS.length,
    elbow,
    knee: kneeA,
    hipKneeDy: hip && knee ? hip.y - knee.y : undefined,
    wristAbove: classified.features.wristAboveShoulder,
  };
}

function mid(frame: PoseFrame, a: Parameters<typeof joint>[1], b: Parameters<typeof joint>[1]) {
  const pa = joint(frame, a);
  const pb = joint(frame, b);
  if (pa && pb) {
    return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  }
  return pa ?? pb;
}

// --- timeline -------------------------------------------------------------------------

console.log('\ntime   posture  cover  elbow  knee   hip-knee  wrist↑sho');
const buckets = new Map<number, Sample[]>();
for (const frame of frames) {
  const key = Math.floor(frame.tMs / 1000 / bucketSec);
  const list = buckets.get(key) ?? [];
  list.push(sample(frame));
  buckets.set(key, list);
}
for (const [key, samples] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
  const posture = dominant(samples.map((s) => s.posture));
  const row = [
    clock(key * bucketSec).padEnd(6),
    posture.padEnd(8),
    pct(meanDefined(samples.map((s) => s.coverage))).padStart(5),
    deg(meanDefined(samples.map((s) => s.elbow))).padStart(6),
    deg(meanDefined(samples.map((s) => s.knee))).padStart(6),
    num(meanDefined(samples.map((s) => s.hipKneeDy))).padStart(9),
    num(meanDefined(samples.map((s) => s.wristAbove))).padStart(10),
  ];
  console.log(row.join(' '));
}

// --- detectors over the whole clip ----------------------------------------------------

const moves: Move[] = [...MOVES];
const hits = new Map<Move, { counted: number[]; rejected: { t: number; reason: string }[] }>();
console.log('\ndetector events (whole clip, plan ' + (plan === RX_PLAN ? 'rx' : 'scaled') + ')');
for (const move of moves) {
  const detector: Detector = createDetector(move, plan);
  detector.reset();
  const counted: number[] = [];
  const rejected: { t: number; reason: string }[] = [];
  for (const frame of frames) {
    const out = detector.step(frame);
    if (out.repCompleted) {
      counted.push(frame.tMs);
    }
    if (out.rejected) {
      rejected.push({ t: frame.tMs, reason: out.rejected.reason });
    }
  }
  hits.set(move, { counted, rejected });
  console.log(
    `  ${detector.id.padEnd(16)} counted ${String(counted.length).padStart(3)}  rejected ${String(rejected.length).padStart(3)}`,
  );
  for (const t of counted) {
    console.log(`    ${clock(t / 1000)}  count`);
  }
  for (const { t, reason } of rejected) {
    console.log(`    ${clock(t / 1000)}  reject ${reason}`);
  }
}

// --- suggested windows ----------------------------------------------------------------

console.log(
  '\nsuggested windows (bursts of counted reps, ≥ 2 reps, gaps < 8 s; pad 3 s each side)',
);
for (const move of moves) {
  const times = hits.get(move)?.counted ?? [];
  for (const burst of bursts(times, 8000)) {
    if (burst.length < 2) {
      continue;
    }
    const from = Math.max(0, (burst[0] ?? 0) / 1000 - 3);
    const to = Math.min(durationSec, (burst.at(-1) ?? 0) / 1000 + 3);
    console.log(
      `  ${move.padEnd(7)} ${burst.length} reps  --from ${from.toFixed(1)} --to ${to.toFixed(1)}   (${clock(from)}–${clock(to)})`,
    );
  }
}
console.log(
  '\nA window where a detector counted but you were doing something else (rows, burpees) is a\nnegative fixture: cut it into fixtures/negative/ with an expect file of maxCounted per move.',
);

// --- helpers --------------------------------------------------------------------------

function bursts(times: number[], gapMs: number): number[][] {
  const out: number[][] = [];
  for (const t of times) {
    const last = out.at(-1);
    if (last && t - (last.at(-1) ?? 0) < gapMs) {
      last.push(t);
    } else {
      out.push([t]);
    }
  }
  return out;
}

function dominant(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '?';
}

function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function pct(v: number | undefined): string {
  return v === undefined ? '-' : `${Math.round(v * 100)}%`;
}

function deg(v: number | undefined): string {
  return v === undefined ? '-' : `${Math.round(v)}°`;
}

function num(v: number | undefined): string {
  return v === undefined ? '-' : (v >= 0 ? '+' : '') + v.toFixed(2);
}
