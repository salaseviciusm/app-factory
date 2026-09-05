import type { VariantPlan } from '../detectors/detector.js';
import { addDays, dayIndexFor, daysBetween, type IsoDate } from '../challenge/dates.js';
import type { WorkoutEvent } from '../workout/events.js';
import { foldSessions } from './sessions.js';

export type ChallengeStatus = 'active' | 'complete' | 'ended' | 'abandoned';

export interface ChallengeState {
  readonly challengeId: string;
  readonly startDate: IsoDate;
  readonly endDate: IsoDate;
  readonly days: number;
  readonly minSessionsPerWeek: number;
  readonly plan: VariantPlan;
  readonly status: ChallengeStatus;
  /** Day index → sessionId that lit it. */
  readonly daysLit: ReadonlyMap<number, string>;
  readonly firstRounds: number | undefined;
  readonly lastRounds: number | undefined;
}

export type DayCell = 'lit' | 'missed' | 'today' | 'future';

/** The most recent challenge and everything the calendar screen needs. */
export function activeChallenge(events: readonly WorkoutEvent[]): ChallengeState | undefined {
  let state: ChallengeState | undefined;
  const sessions = foldSessions(events);
  for (const event of events) {
    switch (event.type) {
      case 'data-erased':
        state = undefined;
        break;
      case 'challenge-started':
        state = {
          challengeId: event.challengeId,
          startDate: event.startDate,
          endDate: addDays(event.startDate, event.days - 1),
          days: event.days,
          minSessionsPerWeek: event.minSessionsPerWeek,
          plan: event.plan,
          status: 'active',
          daysLit: new Map(),
          firstRounds: undefined,
          lastRounds: undefined,
        };
        break;
      case 'challenge-abandoned':
        if (state && state.challengeId === event.challengeId) {
          state = { ...state, status: 'abandoned' };
        }
        break;
      case 'challenge-day-lit':
        if (state && state.challengeId === event.challengeId) {
          const lit = new Map(state.daysLit);
          lit.set(event.dayIndex, event.sessionId);
          const rounds = sessions.get(event.sessionId)?.rounds;
          state = {
            ...state,
            daysLit: lit,
            firstRounds: state.firstRounds ?? rounds,
            lastRounds: rounds ?? state.lastRounds,
          };
        }
        break;
      case 'challenge-completed':
        if (state && state.challengeId === event.challengeId) {
          state = { ...state, status: 'complete' };
        }
        break;
      default:
        break;
    }
  }
  return state;
}

/** Status as of `today`: an active challenge past its end date has ended. */
export function challengeStatusOn(state: ChallengeState, today: IsoDate): ChallengeStatus {
  if (state.status !== 'active') {
    return state.status;
  }
  return daysBetween(state.startDate, today) >= state.days ? 'ended' : 'active';
}

export function calendarCells(state: ChallengeState, today: IsoDate): DayCell[] {
  const todayIndex = dayIndexFor(state.startDate, today, state.days);
  const elapsed = daysBetween(state.startDate, today);
  const cells: DayCell[] = [];
  for (let day = 1; day <= state.days; day += 1) {
    if (state.daysLit.has(day)) {
      cells.push('lit');
    } else if (todayIndex === day) {
      cells.push('today');
    } else if (day - 1 < elapsed) {
      cells.push('missed');
    } else {
      cells.push('future');
    }
  }
  return cells;
}

/** Sessions-per-week pace against the rule, as of today. */
export function paceSummary(
  state: ChallengeState,
  today: IsoDate,
): { lit: number; expected: number } {
  const elapsedDays = Math.min(state.days, Math.max(0, daysBetween(state.startDate, today) + 1));
  const expected = Math.floor((elapsedDays / 7) * state.minSessionsPerWeek);
  return { lit: state.daysLit.size, expected };
}
