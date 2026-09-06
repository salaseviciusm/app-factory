import { classifyPosture, PostureArm } from '../pose/posture.js';
import { angleDeg, joint, meanDefined, type Joint, type PoseFrame } from '../pose/pose-frame.js';
import { CycleMachine, type CycleThresholds } from './cycle-detector.js';
import {
  NO_OUTPUT,
  type Detector,
  type DetectorOutput,
  type PullupVariant,
  type RejectReason,
} from './detector.js';

/**
 * Pull-up on the elbow angle (shoulder–elbow–wrist), averaged over the sides that are
 * visible. Spike 001: hang 160–172°, top 25–43°, wrists stay confident at the top.
 * Chin-over-bar (nose above the wrist line) is a secondary check on the top frame and
 * only rejects when the nose is confidently seen below the bar — the nose flickers.
 */
export const PULLUP_THRESHOLDS: Record<PullupVariant, CycleThresholds> = {
  rx: {
    startAbove: 150,
    endBelow: 75,
    attemptBelow: 120,
    minRepMs: 600,
    smoothing: 0.6,
    countAt: 'leave-end',
    shortReason: 'hang-short',
    repeatReason: 'hang-short',
  },
  jumping: {
    startAbove: 120,
    endBelow: 80,
    attemptBelow: 105,
    minRepMs: 500,
    smoothing: 0.6,
    countAt: 'leave-end',
    shortReason: 'hang-short',
    repeatReason: 'hang-short',
  },
};

/** Nose must be at least this far above the wrist line (normalized height) to pass. */
const CHIN_MARGIN = -0.02;

export class PullupDetector implements Detector {
  readonly move = 'pullup' as const;
  readonly requires: readonly Joint[] = [
    'leftShoulder',
    'rightShoulder',
    'leftElbow',
    'rightElbow',
    'leftWrist',
    'rightWrist',
  ];
  readonly id: string;
  private readonly machine: CycleMachine;
  private readonly arm = new PostureArm('hang');

  constructor(
    readonly variant: PullupVariant,
    thresholds: CycleThresholds = PULLUP_THRESHOLDS[variant],
  ) {
    this.id = `pullup-${variant}-v2`;
    this.machine = new CycleMachine(thresholds, variant === 'rx' ? chinOverBar : undefined);
  }

  reset(): void {
    this.machine.reset();
    this.arm.reset();
  }

  step(frame: PoseFrame): DetectorOutput {
    if (!this.arm.allow(classifyPosture(frame).posture, this.machine)) {
      return { ...NO_OUTPUT, phase: this.machine.currentPhase };
    }
    const sides = [elbowAngle(frame, 'left'), elbowAngle(frame, 'right')];
    const signal = meanDefined(sides.map((s) => s?.angle));
    const confidence = meanDefined(sides.map((s) => s?.confidence)) ?? 0;
    return this.machine.step(frame, { signal, confidence });
  }
}

export function elbowAngle(
  frame: PoseFrame,
  side: 'left' | 'right',
): { angle: number; confidence: number } | undefined {
  const shoulder = joint(frame, `${side}Shoulder`);
  const elbow = joint(frame, `${side}Elbow`);
  const wrist = joint(frame, `${side}Wrist`);
  if (!shoulder || !elbow || !wrist) {
    return undefined;
  }
  return {
    angle: angleDeg(shoulder, elbow, wrist),
    confidence: Math.min(shoulder.c, elbow.c, wrist.c),
  };
}

function chinOverBar(top: PoseFrame): RejectReason | undefined {
  const nose = joint(top, 'nose', 0.5);
  const wrists = [joint(top, 'leftWrist'), joint(top, 'rightWrist')];
  const barY = meanDefined(wrists.map((w) => w?.y));
  if (!nose || barY === undefined) {
    return undefined; // cannot judge; undercount is handled by the elbow gate, not here
  }
  return nose.y <= barY - CHIN_MARGIN ? undefined : 'chin-below-bar';
}
