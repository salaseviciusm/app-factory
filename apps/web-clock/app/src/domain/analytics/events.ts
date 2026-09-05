import {
  defineAnalyticsEvents,
  type AnalyticsClient,
  type AnalyticsProps,
} from '@factory/analytics';
import type { EventBus } from '@factory/core';
import type { WorkoutEvent } from '../workout/events.js';

/** Mirrors brand-pack/features.json — an event not listed there does not ship. */
export const analyticsEvents = defineAnalyticsEvents([
  'challenge-started',
  'session-started',
  'rep-counted',
  'rep-rejected',
  'rep-added-manually',
  'round-completed',
  'session-finished',
  'challenge-day-lit',
  'challenge-completed',
  'card-shared',
]);

export type AnalyticsEvent = (typeof analyticsEvents)[number];

const tracked = new Set<string>(analyticsEvents);

/**
 * Bridges the domain log to the analytics seam: only listed events, only scalar
 * properties, no ids that could identify a person. Activation is `session-finished`
 * with early=false; habit is `challenge-day-lit`.
 */
export function bridgeAnalytics(
  bus: EventBus<WorkoutEvent>,
  analytics: AnalyticsClient<AnalyticsEvent>,
): void {
  bus.subscribeAll((event) => {
    if (!tracked.has(event.type)) {
      return;
    }
    analytics.track(event.type as AnalyticsEvent, propsFor(event));
  });
}

function propsFor(event: WorkoutEvent): AnalyticsProps {
  switch (event.type) {
    case 'session-started':
      return { dayIndex: event.dayIndex ?? 0, inChallenge: event.challengeId !== undefined };
    case 'rep-counted':
      return {
        move: event.move,
        variant: event.variant,
        detectorId: event.detectorId,
        round: event.round,
      };
    case 'rep-rejected':
      return {
        move: event.move,
        variant: event.variant,
        detectorId: event.detectorId,
        reason: event.reason,
      };
    case 'rep-added-manually':
      return { move: event.move, round: event.round };
    case 'round-completed':
      return { round: event.round };
    case 'session-finished':
      return {
        rounds: event.rounds,
        leftoverReps: event.leftoverReps,
        repsCounted: event.repsCounted,
        repsManual: event.repsManual,
        repsRejected: event.repsRejected,
        early: event.early,
        framingLostMs: event.framingLostMs,
      };
    case 'challenge-day-lit':
      return { dayIndex: event.dayIndex };
    case 'challenge-completed':
      return {
        daysLit: event.daysLit,
        firstRounds: event.firstRounds,
        lastRounds: event.lastRounds,
      };
    case 'card-shared':
      return { kind: event.kind };
    case 'challenge-started':
      return { days: event.days, minSessionsPerWeek: event.minSessionsPerWeek };
    default:
      return {};
  }
}
