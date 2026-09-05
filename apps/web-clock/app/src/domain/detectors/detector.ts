import type { Joint, PoseFrame } from '../pose/pose-frame.js';

export type Move = 'pullup' | 'pushup' | 'squat';

/** Scaled variants are detector variants, not a different workout. */
export type PullupVariant = 'rx' | 'jumping';
export type PushupVariant = 'rx' | 'knee';
export type SquatVariant = 'rx' | 'box';
export type Variant = PullupVariant | PushupVariant | SquatVariant;

export interface VariantPlan {
  readonly pullup: PullupVariant;
  readonly pushup: PushupVariant;
  readonly squat: SquatVariant;
}

export const RX_PLAN: VariantPlan = { pullup: 'rx', pushup: 'rx', squat: 'rx' };
export const SCALED_PLAN: VariantPlan = { pullup: 'jumping', pushup: 'knee', squat: 'box' };

/**
 * Closed set. Every non-counted rep the detector saw becomes a reject with one of
 * these, so the HUD can always say why — nothing is dropped silently.
 */
export type RejectReason =
  | 'hang-short'
  | 'chin-below-bar'
  | 'lockout-short'
  | 'depth-short'
  | 'tempo-too-fast'
  | 'low-confidence'
  | 'framing-lost';

export const REJECT_COPY: Record<RejectReason, string> = {
  'hang-short': 'Arms straight at the bottom',
  'chin-below-bar': 'Chin over the bar',
  'lockout-short': 'Lock out at the top',
  'depth-short': 'Go lower',
  'tempo-too-fast': 'Too fast to read',
  'low-confidence': "Couldn't see you",
  'framing-lost': 'Step back into frame',
};

export interface DetectorOutput {
  /** Detector-specific phase; shown on the debug HUD, never persisted. */
  readonly phase: string;
  readonly repCompleted: boolean;
  readonly rejected?: { readonly reason: RejectReason };
  /** 0..1 — how much the detector trusts what it saw this frame. */
  readonly confidence: number;
  /** The scalar the detector is watching (an angle, usually). For tuning. */
  readonly signal?: number;
}

export interface Detector {
  /** `${move}-${variant}-v${n}`; frozen once shipped, bump for retunes. */
  readonly id: string;
  readonly move: Move;
  readonly variant: Variant;
  /** Joints the framing gate must see before this detector is trusted. */
  readonly requires: readonly Joint[];
  reset(): void;
  step(frame: PoseFrame): DetectorOutput;
}

export const NO_OUTPUT: DetectorOutput = { phase: 'unknown', repCompleted: false, confidence: 0 };
