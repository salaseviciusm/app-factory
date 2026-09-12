import { classifyPosture, PostureArm } from '../pose/posture.js';
import { meanDefined, type Joint, type PoseFrame } from '../pose/pose-frame.js';
import { CycleMachine, type CycleThresholds } from './cycle-detector.js';
import { NO_OUTPUT, type Detector, type DetectorOutput, type RowVariant } from './detector.js';
import { elbowAngle } from './pullup-detector.js';

/**
 * Inverted row (Australian pull-up): same elbow-angle cycle as a push-up, but the
 * athlete is *under* the bar. The posture gate (supine: horizontal torso, wrists
 * above the shoulders) is what stops this being counted as a push-up or a pull-up.
 */
export const ROW_THRESHOLDS: Record<RowVariant, CycleThresholds> = {
  rx: {
    startAbove: 150,
    endBelow: 95,
    attemptBelow: 130,
    minRepMs: 500,
    smoothing: 0.6,
    countAt: 'start',
    shortReason: 'lockout-short',
    repeatReason: 'lockout-short',
  },
};

export class RowDetector implements Detector {
  readonly move = 'row' as const;
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
  private readonly arm = new PostureArm('supine', 10, ['plank']);

  constructor(
    readonly variant: RowVariant = 'rx',
    thresholds: CycleThresholds = ROW_THRESHOLDS[variant],
  ) {
    this.id = `row-${variant}-v1`;
    this.machine = new CycleMachine(thresholds);
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
