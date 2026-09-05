import { boundingBox, joint, type Joint, type PoseFrame } from '../pose/pose-frame.js';

export type FramingState = 'ok' | 'no-body' | 'joints-missing' | 'too-close';

export interface FramingResult {
  readonly state: FramingState;
  /** Fraction of required joints seen this frame. */
  readonly coverage: number;
}

export interface FramingOptions {
  /** Frames considered for hysteresis (~0.5 s at 30 fps). */
  readonly window: number;
  /** Fraction of the window that must pass before we say ok / fail. */
  readonly ratio: number;
  /** Required joints seen, as a fraction, for a frame to pass. */
  readonly minCoverage: number;
  /** Bounding box of required joints larger than this (normalized) means too close. */
  readonly maxExtent: number;
}

export const DEFAULT_FRAMING: FramingOptions = {
  window: 15,
  ratio: 0.7,
  minCoverage: 0.75,
  maxExtent: 0.97,
};

/**
 * Says whether the detector's required joints are reliably in frame. Hysteresis over a
 * short window so a single dropped frame does not flip the HUD. Pure; no timers.
 */
export class FramingGate {
  private readonly history: FramingState[] = [];
  private state: FramingState = 'no-body';

  constructor(
    private readonly required: readonly Joint[],
    private readonly options: FramingOptions = DEFAULT_FRAMING,
  ) {}

  reset(): void {
    this.history.length = 0;
    this.state = 'no-body';
  }

  step(frame: PoseFrame): FramingResult {
    const seen = this.required.filter((name) => joint(frame, name) !== undefined).length;
    const coverage = this.required.length === 0 ? 1 : seen / this.required.length;
    const instant = this.classify(frame, coverage);
    this.history.push(instant);
    if (this.history.length > this.options.window) {
      this.history.shift();
    }
    const okCount = this.history.filter((s) => s === 'ok').length;
    const needed = Math.ceil(this.options.ratio * this.history.length);
    if (okCount >= needed) {
      this.state = 'ok';
    } else if (this.history.length - okCount >= needed) {
      this.state = this.dominantFailure();
    }
    return { state: this.state, coverage };
  }

  private classify(frame: PoseFrame, coverage: number): FramingState {
    if (coverage === 0) {
      return 'no-body';
    }
    if (coverage < this.options.minCoverage) {
      return 'joints-missing';
    }
    const box = boundingBox(frame, this.required);
    if (
      box &&
      (box.maxX - box.minX > this.options.maxExtent || box.maxY - box.minY > this.options.maxExtent)
    ) {
      return 'too-close';
    }
    return 'ok';
  }

  private dominantFailure(): FramingState {
    const counts = new Map<FramingState, number>();
    for (const s of this.history) {
      if (s !== 'ok') {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    let best: FramingState = 'no-body';
    let bestCount = -1;
    for (const [state, n] of counts) {
      if (n > bestCount) {
        best = state;
        bestCount = n;
      }
    }
    return best;
  }
}
