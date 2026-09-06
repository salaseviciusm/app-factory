// Replay every detector over a pose fixture and write a per-frame trace for
// tools/debug-render.swift. Times stay in fixture milliseconds (windowed fixtures
// start at 0; add fixture.window.fromSec when matching a source video).
//
//   npm run trace -- /tmp/img-1151.json /tmp/img-1151.trace.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createDetector } from '../src/domain/detectors/index.js';
import {
  MOVES,
  RX_PLAN,
  SCALED_PLAN,
  type Detector,
  type Move,
  type RejectReason,
  type VariantPlan,
} from '../src/domain/detectors/detector.js';
import { elbowAngle } from '../src/domain/detectors/pullup-detector.js';
import { kneeAngle } from '../src/domain/detectors/squat-detector.js';
import { fixtureFrames, type PoseFixture } from '../src/domain/pose/fixture.js';
import { classifyPosture } from '../src/domain/pose/posture.js';
import { JOINTS, joint, meanDefined } from '../src/domain/pose/pose-frame.js';

export interface TraceEvent {
  readonly move: Move;
  readonly kind: 'count' | 'reject';
  readonly reason?: RejectReason;
}

export interface TraceMoveState {
  readonly count: number;
  readonly phase: string;
  readonly signal?: number;
}

export interface TraceFrame {
  readonly t: number;
  readonly posture: string;
  readonly tilt?: number;
  readonly wristAbove?: number;
  readonly elbow?: number;
  readonly knee?: number;
  readonly coverage: number;
  readonly pullup: TraceMoveState;
  readonly pushup: TraceMoveState;
  readonly squat: TraceMoveState;
  readonly row: TraceMoveState;
  readonly events: TraceEvent[];
}

const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error('usage: trace-fixture <fixture.json> <trace.json> [--plan rx|scaled]');
  process.exit(2);
}
const planFlag = rest.indexOf('--plan');
const plan: VariantPlan = planFlag >= 0 && rest[planFlag + 1] === 'scaled' ? SCALED_PLAN : RX_PLAN;

const fixture = JSON.parse(readFileSync(input, 'utf8')) as PoseFixture;
const frames = fixtureFrames(fixture);
const detectors = Object.fromEntries(
  MOVES.map((move) => [move, createDetector(move, plan)]),
) as Record<Move, Detector>;
const counts: Record<Move, number> = { pullup: 0, pushup: 0, squat: 0, row: 0 };

const traced: TraceFrame[] = frames.map((frame) => {
  const classified = classifyPosture(frame);
  const seen = JOINTS.filter((name) => joint(frame, name) !== undefined).length;
  const events: TraceEvent[] = [];
  const states = {} as Record<Move, TraceMoveState>;
  for (const move of MOVES) {
    const out = detectors[move].step(frame);
    if (out.repCompleted) {
      counts[move] += 1;
      events.push({ move, kind: 'count' });
    }
    if (out.rejected) {
      events.push({ move, kind: 'reject', reason: out.rejected.reason });
    }
    states[move] = { count: counts[move], phase: out.phase, signal: out.signal };
  }
  return {
    t: frame.tMs,
    posture: classified.posture,
    tilt: classified.features.torsoTilt,
    wristAbove: classified.features.wristAboveShoulder,
    elbow: meanDefined([elbowAngle(frame, 'left')?.angle, elbowAngle(frame, 'right')?.angle]),
    knee: meanDefined([kneeAngle(frame, 'left')?.angle, kneeAngle(frame, 'right')?.angle]),
    coverage: seen / JOINTS.length,
    pullup: states.pullup,
    pushup: states.pushup,
    squat: states.squat,
    row: states.row,
    events,
  };
});

const totals = Object.fromEntries(MOVES.map((m) => [m, counts[m]]));
writeFileSync(
  output,
  JSON.stringify({
    version: 1,
    source: fixture.source,
    label: fixture.label,
    window: fixture.window,
    width: fixture.width,
    height: fixture.height,
    plan: plan === RX_PLAN ? 'rx' : 'scaled',
    totals,
    frames: traced,
  }),
);
console.log(
  `${output}: ${traced.length} frames  pull ${counts.pullup}  push ${counts.pushup}  squat ${counts.squat}  row ${counts.row}`,
);
