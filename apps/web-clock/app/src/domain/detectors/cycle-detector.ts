import type { PoseFrame } from '../pose/pose-frame.js';
import type { DetectorOutput, RejectReason } from './detector.js';

/**
 * Shared rep machine. A rep is a round trip on one scalar signal (an elbow or knee
 * angle): start → end → start. Hysteresis thresholds keep flicker from counting.
 *
 *   start   : signal ≥ startAbove   (hang / lockout / standing)
 *   end     : signal ≤ endBelow     (top of pull-up / bottom of push-up or squat)
 *   attempt : signal ≤ attemptBelow  — far enough to call it a try; a try that never
 *             reaches `end` before returning to start is rejected as short.
 */
export interface CycleThresholds {
  readonly startAbove: number;
  readonly endBelow: number;
  readonly attemptBelow: number;
  /** Two counted reps closer than this are noise, not athletics. */
  readonly minRepMs: number;
  /** EMA weight for the incoming signal; 1 = no smoothing. */
  readonly smoothing: number;
  /**
   * When the rep counts. `leave-end`: the moment the athlete starts back from the far
   * end (pull-ups — chin has cleared, and the deepest frame is known). `start`: on
   * return to the start position (push-ups, squats — lockout / standing is the rep).
   */
  readonly countAt: 'leave-end' | 'start';
  readonly shortReason: RejectReason;
  /** Reaching `end` again without passing `start` in between (only with `leave-end`). */
  readonly repeatReason: RejectReason;
}

export type CyclePhase = 'unknown' | 'start' | 'toward-end' | 'end' | 'toward-start';

export interface CycleStep {
  /** The raw signal, or undefined when the joints were not visible. */
  readonly signal: number | undefined;
  readonly confidence: number;
}

export class CycleMachine {
  private phase: CyclePhase = 'unknown';
  private smoothed: number | undefined;
  private reachedEnd = false;
  private reachedAttempt = false;
  private countedThisCycle = false;
  private lastCountMs = Number.NEGATIVE_INFINITY;
  private deepest: PoseFrame | undefined;
  private deepestValue = Number.POSITIVE_INFINITY;

  constructor(
    private readonly thresholds: CycleThresholds,
    /** Extra check run on the deepest frame when a rep would count. */
    private readonly validate?: (deepest: PoseFrame) => RejectReason | undefined,
  ) {}

  reset(): void {
    this.phase = 'unknown';
    this.smoothed = undefined;
    this.reachedEnd = false;
    this.reachedAttempt = false;
    this.countedThisCycle = false;
    this.lastCountMs = Number.NEGATIVE_INFINITY;
    this.deepest = undefined;
    this.deepestValue = Number.POSITIVE_INFINITY;
  }

  get currentPhase(): CyclePhase {
    return this.phase;
  }

  step(frame: PoseFrame, input: CycleStep): DetectorOutput {
    if (input.signal === undefined) {
      return { phase: this.phase, repCompleted: false, confidence: 0, signal: this.smoothed };
    }
    const t = this.thresholds;
    this.smoothed =
      this.smoothed === undefined
        ? input.signal
        : this.smoothed + (input.signal - this.smoothed) * t.smoothing;
    const s = this.smoothed;
    const c = input.confidence;

    switch (this.phase) {
      case 'unknown':
        if (s >= t.startAbove) {
          this.phase = 'start';
        }
        return this.out(false, undefined, c);

      case 'start':
        if (s < t.startAbove) {
          this.phase = 'toward-end';
          this.deepest = frame;
          this.deepestValue = s;
        }
        return this.out(false, undefined, c);

      case 'toward-end':
        this.trackDeepest(frame, s);
        if (s <= t.attemptBelow) {
          this.reachedAttempt = true;
        }
        if (s <= t.endBelow) {
          this.phase = 'end';
          this.reachedEnd = true;
          return this.out(false, undefined, c);
        }
        if (s >= t.startAbove) {
          return this.arriveAtStart(frame, c);
        }
        return this.out(false, undefined, c);

      case 'end':
        this.trackDeepest(frame, s);
        if (s > t.endBelow) {
          this.phase = 'toward-start';
          if (t.countAt === 'leave-end' && !this.countedThisCycle) {
            this.countedThisCycle = true;
            return this.count(frame, c);
          }
        }
        return this.out(false, undefined, c);

      case 'toward-start':
        if (s >= t.startAbove) {
          return this.arriveAtStart(frame, c);
        }
        if (s <= t.endBelow) {
          this.phase = 'end';
          this.deepest = frame;
          this.deepestValue = s;
          // Back at the far end without a full return: the second half was short.
          return this.out(false, t.countAt === 'leave-end' ? t.repeatReason : undefined, c);
        }
        return this.out(false, undefined, c);
    }
  }

  private trackDeepest(frame: PoseFrame, s: number): void {
    if (s < this.deepestValue) {
      this.deepest = frame;
      this.deepestValue = s;
    }
  }

  private arriveAtStart(frame: PoseFrame, confidence: number): DetectorOutput {
    const t = this.thresholds;
    const hadEnd = this.reachedEnd;
    const hadAttempt = this.reachedAttempt;
    const counted = this.countedThisCycle;
    this.phase = 'start';
    this.reachedEnd = false;
    this.reachedAttempt = false;
    this.countedThisCycle = false;
    this.deepestValue = Number.POSITIVE_INFINITY;
    if (hadEnd && t.countAt === 'start') {
      return this.count(frame, confidence);
    }
    if (!hadEnd && hadAttempt && !counted) {
      return this.out(false, t.shortReason, confidence);
    }
    return this.out(false, undefined, confidence);
  }

  private count(frame: PoseFrame, confidence: number): DetectorOutput {
    const t = this.thresholds;
    if (frame.tMs - this.lastCountMs < t.minRepMs) {
      return this.out(false, 'tempo-too-fast', confidence);
    }
    const reason = this.validate?.(this.deepest ?? frame);
    if (reason) {
      return this.out(false, reason, confidence);
    }
    this.lastCountMs = frame.tMs;
    return this.out(true, undefined, confidence);
  }

  private out(rep: boolean, reason: RejectReason | undefined, confidence: number): DetectorOutput {
    return {
      phase: this.phase,
      repCompleted: rep,
      rejected: reason ? { reason } : undefined,
      confidence,
      signal: this.smoothed,
    };
  }
}
