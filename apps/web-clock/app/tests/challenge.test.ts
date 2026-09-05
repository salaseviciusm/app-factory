import { describe, expect, it } from 'vitest';
import { ChallengeService } from '../src/domain/challenge/challenge-service.js';
import { addDays, dayIndexFor, daysBetween, toIsoDate } from '../src/domain/challenge/dates.js';
import { RX_PLAN, SCALED_PLAN } from '../src/domain/detectors/detector.js';
import {
  activeChallenge,
  calendarCells,
  challengeStatusOn,
  paceSummary,
} from '../src/domain/projections/challenge-calendar.js';
import { finishedSessions, personalBest } from '../src/domain/projections/sessions.js';
import { foldSettings } from '../src/domain/projections/settings.js';
import {
  challengeStarted,
  sessionFinished,
  sessionStarted,
  repCounted,
  targetChanged,
} from '../src/domain/workout/events.js';
import { testDeps } from './helpers.js';

const DAY = 86_400_000;

function startChallenge(deps: ReturnType<typeof testDeps>, startDate: string) {
  deps.bus.publish(
    challengeStarted.create(deps, {
      challengeId: 'c1',
      kind: 'winter-arc-30',
      startDate,
      days: 30,
      minSessionsPerWeek: 5,
      plan: SCALED_PLAN,
    }),
  );
}

function fullSession(
  deps: ReturnType<typeof testDeps>,
  id: string,
  rounds: number,
  counted = 1,
  early = false,
) {
  deps.bus.publish(
    sessionStarted.create(deps, {
      sessionId: id,
      challengeId: 'c1',
      workout: 'cindy-20',
      plan: SCALED_PLAN,
    }),
  );
  for (let i = 0; i < counted; i += 1) {
    deps.bus.publish(
      repCounted.create(deps, {
        sessionId: id,
        move: 'squat',
        variant: 'box',
        detectorId: 'squat-box-v1',
        round: 1,
        indexInSet: i + 1,
        tMs: i,
      }),
    );
  }
  deps.bus.publish(
    sessionFinished.create(deps, {
      sessionId: id,
      rounds,
      leftoverReps: 0,
      repsCounted: counted,
      repsManual: 0,
      repsRejected: 0,
      early,
      durationMs: 1_200_000,
      framingLostMs: 0,
    }),
  );
}

describe('dates', () => {
  it('works in local days', () => {
    const start = toIsoDate(deps0());
    expect(daysBetween(start, start)).toBe(0);
    expect(daysBetween(start, addDays(start, 29))).toBe(29);
    expect(dayIndexFor(start, addDays(start, 29), 30)).toBe(30);
    expect(dayIndexFor(start, addDays(start, 30), 30)).toBeUndefined();
    expect(dayIndexFor(start, addDays(start, -1), 30)).toBeUndefined();
  });
});

function deps0(): number {
  return 1_700_000_000_000;
}

describe('ChallengeService', () => {
  it('lights today once for a full session with counted reps', () => {
    const deps = testDeps();
    new ChallengeService(deps).start();
    const today = toIsoDate(deps.clock());
    startChallenge(deps, today);
    fullSession(deps, 's1', 3);
    fullSession(deps, 's2', 4);
    const lit = deps.events().filter((e) => e.type === 'challenge-day-lit');
    expect(lit).toHaveLength(1);
    expect(lit[0]).toMatchObject({ dayIndex: 1, sessionId: 's1', date: today });
  });

  it('does not light for early finishes or manual-only sessions', () => {
    const deps = testDeps();
    new ChallengeService(deps).start();
    startChallenge(deps, toIsoDate(deps.clock()));
    fullSession(deps, 's1', 3, 1, true);
    fullSession(deps, 's2', 3, 0, false);
    expect(deps.events().filter((e) => e.type === 'challenge-day-lit')).toHaveLength(0);
  });

  it('completes the challenge when day 30 is lit and records first vs last rounds', () => {
    const deps = testDeps();
    new ChallengeService(deps).start();
    const start = toIsoDate(deps.clock());
    startChallenge(deps, start);
    fullSession(deps, 's1', 3);
    deps.advance(29 * DAY);
    fullSession(deps, 's30', 11);
    const completed = deps.events().find((e) => e.type === 'challenge-completed');
    expect(completed).toMatchObject({
      challengeId: 'c1',
      daysLit: 2,
      firstRounds: 3,
      lastRounds: 11,
    });
    const state = activeChallenge(deps.events());
    expect(state?.status).toBe('complete');
  });
});

describe('challenge calendar projection', () => {
  it('marks lit, today, missed and future cells', () => {
    const deps = testDeps();
    new ChallengeService(deps).start();
    const start = toIsoDate(deps.clock());
    startChallenge(deps, start);
    fullSession(deps, 's1', 3);
    deps.advance(2 * DAY);
    const state = activeChallenge(deps.events());
    expect(state).toBeDefined();
    const cells = calendarCells(state!, toIsoDate(deps.clock()));
    expect(cells.slice(0, 4)).toEqual(['lit', 'missed', 'today', 'future']);
    expect(cells).toHaveLength(30);
    expect(challengeStatusOn(state!, toIsoDate(deps.clock()))).toBe('active');
    expect(challengeStatusOn(state!, addDays(start, 30))).toBe('ended');
    expect(paceSummary(state!, toIsoDate(deps.clock()))).toEqual({ lit: 1, expected: 2 });
  });
});

describe('sessions and settings projections', () => {
  it('lists finished sessions newest first and finds the PB', () => {
    const deps = testDeps();
    startChallenge(deps, toIsoDate(deps.clock()));
    fullSession(deps, 's1', 3);
    deps.advance(DAY);
    fullSession(deps, 's2', 6);
    deps.advance(DAY);
    fullSession(deps, 's3', 5);
    const list = finishedSessions(deps.events());
    expect(list.map((s) => s.sessionId)).toEqual(['s3', 's2', 's1']);
    expect(personalBest(list)?.sessionId).toBe('s2');
    expect(list[0]?.repsByMove.squat).toBe(1);
  });

  it('folds target, plan and camera with sensible defaults', () => {
    const deps = testDeps();
    expect(foldSettings(deps.events())).toEqual({
      targetRounds: 27,
      plan: RX_PLAN,
      camera: 'front',
    });
    deps.bus.publish(targetChanged.create(deps, { targetRounds: 12 }));
    startChallenge(deps, toIsoDate(deps.clock()));
    expect(foldSettings(deps.events())).toEqual({
      targetRounds: 12,
      plan: SCALED_PLAN,
      camera: 'front',
    });
  });
});
