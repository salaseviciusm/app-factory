import type { Clock, EventBus, EventStore, NewId, Subscription } from '@factory/core';
import { dayIndexFor, toIsoDate } from './dates.js';
import { activeChallenge } from '../projections/challenge-calendar.js';
import { challengeCompleted, challengeDayLit, type WorkoutEvent } from '../workout/events.js';

export interface ChallengeServiceDeps {
  readonly bus: EventBus<WorkoutEvent>;
  readonly store: EventStore<WorkoutEvent>;
  readonly newId: NewId;
  readonly clock: Clock;
}

/**
 * "A day is lit when the camera saw it." Reacts to finished sessions: a full 20:00
 * with at least one camera-counted rep lights today's day of the active challenge,
 * once. Lighting the last day completes the challenge.
 */
export class ChallengeService {
  private subscription: Subscription | undefined;

  constructor(private readonly deps: ChallengeServiceDeps) {}

  start(): void {
    this.subscription?.unsubscribe();
    this.subscription = this.deps.bus.subscribe('session-finished', (event) => {
      if (event.early || event.repsCounted === 0) {
        return;
      }
      const now = this.deps.clock();
      const today = toIsoDate(now);
      const challenge = activeChallenge(this.deps.store.read());
      if (!challenge || challenge.status !== 'active') {
        return;
      }
      const dayIndex = dayIndexFor(challenge.startDate, today, challenge.days);
      if (dayIndex === undefined || challenge.daysLit.has(dayIndex)) {
        return;
      }
      this.deps.bus.publish(
        challengeDayLit.create(this.deps, {
          challengeId: challenge.challengeId,
          dayIndex,
          sessionId: event.sessionId,
          date: today,
        }),
      );
      if (dayIndex === challenge.days) {
        const after = activeChallenge(this.deps.store.read());
        this.deps.bus.publish(
          challengeCompleted.create(this.deps, {
            challengeId: challenge.challengeId,
            daysLit: after?.daysLit.size ?? challenge.daysLit.size + 1,
            firstRounds: after?.firstRounds ?? 0,
            lastRounds: after?.lastRounds ?? event.rounds,
          }),
        );
      }
    });
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }
}
