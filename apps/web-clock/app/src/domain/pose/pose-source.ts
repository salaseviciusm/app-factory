import type { PoseFrame } from './pose-frame.js';

export type PoseSourceKind = 'live' | 'sim' | 'fixture';

export type Unsubscribe = () => void;

/**
 * The seam between "where poses come from" and everything that consumes them.
 * live = the native Vision module; sim = synthetic joints for UI work without
 * footage; fixture = a recorded keypoint track replayed at wall-clock or faster.
 */
export interface PoseSource {
  readonly kind: PoseSourceKind;
  start(): Promise<void>;
  stop(): void;
  subscribe(listener: (frame: PoseFrame) => void): Unsubscribe;
}
