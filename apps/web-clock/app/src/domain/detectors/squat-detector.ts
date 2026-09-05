import { angleDeg, joint, meanDefined, type Joint, type PoseFrame } from '../pose/pose-frame.js';
import { CycleMachine, type CycleThresholds } from './cycle-detector.js';
import type { Detector, DetectorOutput, RejectReason, SquatVariant } from './detector.js';

/**
 * Air squat on the knee angle (hip–knee–ankle), 2D only — spike 002 found Vision's 3D
 * hips templated. Rx depth additionally wants the hip crease at or below the knee on
 * the deepest frame; the box variant just wants a real bend.
 */
export const SQUAT_THRESHOLDS: Record<SquatVariant, CycleThresholds> = {
  rx: {
    startAbove: 160,
    endBelow: 100,
    attemptBelow: 140,
    minRepMs: 600,
    smoothing: 0.6,
    countAt: 'start',
    shortReason: 'depth-short',
    repeatReason: 'depth-short',
  },
  box: {
    startAbove: 160,
    endBelow: 120,
    attemptBelow: 145,
    minRepMs: 600,
    smoothing: 0.6,
    countAt: 'start',
    shortReason: 'depth-short',
    repeatReason: 'depth-short',
  },
};

/** Hip may sit this much above the knee (normalized) and still count as parallel. */
const PARALLEL_MARGIN = 0.03;

export class SquatDetector implements Detector {
  readonly move = 'squat' as const;
  readonly requires: readonly Joint[] = [
    'leftHip',
    'rightHip',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle',
  ];
  readonly id: string;
  private readonly machine: CycleMachine;

  constructor(
    readonly variant: SquatVariant,
    thresholds: CycleThresholds = SQUAT_THRESHOLDS[variant],
  ) {
    this.id = `squat-${variant}-v1`;
    this.machine = new CycleMachine(thresholds, variant === 'rx' ? hipBelowKnee : undefined);
  }

  reset(): void {
    this.machine.reset();
  }

  step(frame: PoseFrame): DetectorOutput {
    const sides = [kneeAngle(frame, 'left'), kneeAngle(frame, 'right')];
    const signal = meanDefined(sides.map((s) => s?.angle));
    const confidence = meanDefined(sides.map((s) => s?.confidence)) ?? 0;
    return this.machine.step(frame, { signal, confidence });
  }
}

export function kneeAngle(
  frame: PoseFrame,
  side: 'left' | 'right',
): { angle: number; confidence: number } | undefined {
  const hip = joint(frame, `${side}Hip`);
  const knee = joint(frame, `${side}Knee`);
  const ankle = joint(frame, `${side}Ankle`);
  if (!hip || !knee || !ankle) {
    return undefined;
  }
  return { angle: angleDeg(hip, knee, ankle), confidence: Math.min(hip.c, knee.c, ankle.c) };
}

function hipBelowKnee(bottom: PoseFrame): RejectReason | undefined {
  const hipY = meanDefined([joint(bottom, 'leftHip')?.y, joint(bottom, 'rightHip')?.y]);
  const kneeY = meanDefined([joint(bottom, 'leftKnee')?.y, joint(bottom, 'rightKnee')?.y]);
  if (hipY === undefined || kneeY === undefined) {
    return undefined;
  }
  // y grows downward: a hip at or below the knee has hipY >= kneeY.
  return hipY >= kneeY - PARALLEL_MARGIN ? undefined : 'depth-short';
}
