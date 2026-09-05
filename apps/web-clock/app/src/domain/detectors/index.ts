import type { Detector, Move, VariantPlan } from './detector.js';
import { PullupDetector } from './pullup-detector.js';
import { PushupDetector } from './pushup-detector.js';
import { SquatDetector } from './squat-detector.js';

export function createDetector(move: Move, plan: VariantPlan): Detector {
  switch (move) {
    case 'pullup':
      return new PullupDetector(plan.pullup);
    case 'pushup':
      return new PushupDetector(plan.pushup);
    case 'squat':
      return new SquatDetector(plan.squat);
  }
}
