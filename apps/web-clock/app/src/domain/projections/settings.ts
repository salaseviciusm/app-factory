import { RX_PLAN, type VariantPlan } from '../detectors/detector.js';
import type { WorkoutEvent } from '../workout/events.js';

export interface Settings {
  readonly targetRounds: number;
  readonly plan: VariantPlan;
  readonly camera: 'front' | 'back';
}

/** 27 is the publicly reported record the marketing rides; it is only a default. */
export const DEFAULT_TARGET_ROUNDS = 27;

export function foldSettings(events: readonly WorkoutEvent[]): Settings {
  let settings: Settings = { targetRounds: DEFAULT_TARGET_ROUNDS, plan: RX_PLAN, camera: 'front' };
  for (const event of events) {
    switch (event.type) {
      case 'target-changed':
        settings = { ...settings, targetRounds: event.targetRounds };
        break;
      case 'plan-changed':
        settings = { ...settings, plan: event.plan };
        break;
      case 'challenge-started':
        settings = { ...settings, plan: event.plan };
        break;
      case 'camera-changed':
        settings = { ...settings, camera: event.facing };
        break;
      case 'data-erased':
        settings = { targetRounds: DEFAULT_TARGET_ROUNDS, plan: RX_PLAN, camera: 'front' };
        break;
      default:
        break;
    }
  }
  return settings;
}
