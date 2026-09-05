import { meanDefined, type Joint, type PoseFrame } from '../pose/pose-frame.js';
import { CycleMachine, type CycleThresholds } from './cycle-detector.js';
import type { Detector, DetectorOutput, PushupVariant } from './detector.js';
import { elbowAngle } from './pullup-detector.js';

/**
 * Push-up on the same elbow angle, inverted: start = lockout (arms straight), end =
 * bottom (elbows bent). Counted on return to lockout. Knee variant has a shallower
 * bottom because the torso angle changes the projected elbow angle.
 */
export const PUSHUP_THRESHOLDS: Record<PushupVariant, CycleThresholds> = {
  rx: {
    startAbove: 150,
    endBelow: 95,
    attemptBelow: 130,
    minRepMs: 500,
    smoothing: 0.6,
    countAt: 'start',
    shortReason: 'depth-short',
    repeatReason: 'lockout-short',
  },
  knee: {
    startAbove: 150,
    endBelow: 105,
    attemptBelow: 135,
    minRepMs: 500,
    smoothing: 0.6,
    countAt: 'start',
    shortReason: 'depth-short',
    repeatReason: 'lockout-short',
  },
};

export class PushupDetector implements Detector {
  readonly move = 'pushup' as const;
  readonly requires: readonly Joint[] = ['leftShoulder', 'leftElbow', 'leftWrist'];
  readonly id: string;
  private readonly machine: CycleMachine;

  constructor(
    readonly variant: PushupVariant,
    thresholds: CycleThresholds = PUSHUP_THRESHOLDS[variant],
  ) {
    this.id = `pushup-${variant}-v1`;
    this.machine = new CycleMachine(thresholds);
  }

  reset(): void {
    this.machine.reset();
  }

  step(frame: PoseFrame): DetectorOutput {
    // Side-on, the far arm is often occluded: use whichever side is visible.
    const sides = [elbowAngle(frame, 'left'), elbowAngle(frame, 'right')];
    const signal = meanDefined(sides.map((s) => s?.angle));
    const confidence = meanDefined(sides.map((s) => s?.confidence)) ?? 0;
    return this.machine.step(frame, { signal, confidence });
  }
}
