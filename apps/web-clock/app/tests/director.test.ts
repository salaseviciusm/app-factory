import { describe, expect, it } from 'vitest';
import { RX_PLAN, SCALED_PLAN } from '../src/domain/detectors/detector.js';
import { simFrame, simPoseAt } from '../src/domain/pose/sim-pose.js';
import { AmrapClock, formatClock } from '../src/domain/workout/amrap-clock.js';
import { CINDY, formatScore, scoreFrom } from '../src/domain/workout/cindy.js';
import { WorkoutDirector } from '../src/domain/workout/director.js';
import type { Move } from '../src/domain/detectors/detector.js';
import { testDeps } from './helpers.js';

/** Feed the director enough simulated frames of `move` to complete `reps`. */
function perform(
  director: WorkoutDirector,
  deps: ReturnType<typeof testDeps>,
  move: Move,
  reps: number,
): void {
  const periodMs = 1500;
  // Hold the start position long enough to settle the framing gate and outlast the
  // transition guard, exactly as an athlete would between movements.
  for (let i = 0; i < 60; i += 1) {
    director.onFrame(simPoseAt(move, 0, deps.clock()));
    deps.advance(33);
  }
  const start = deps.clock();
  for (let t = 0; t <= reps * periodMs; t += 33) {
    director.onFrame(simFrame(move, start + t, periodMs));
    deps.setNow(start + t);
  }
  for (let i = 0; i < 10; i += 1) {
    director.onFrame(simPoseAt(move, 0, deps.clock()));
    deps.advance(33);
  }
}

describe('WorkoutDirector', () => {
  it('walks framing → ready → running and publishes session-started', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: RX_PLAN, targetRounds: 27 });
    expect(director.live.get().phase).toBe('framing');
    for (let i = 0; i < 15; i += 1) {
      director.onFrame(simPoseAt('pullup', 0, i * 33));
    }
    expect(director.live.get().phase).toBe('ready');
    director.start();
    expect(director.live.get().phase).toBe('running');
    expect(deps.events().map((e) => e.type)).toEqual(['session-started']);
  });

  it('advances 5 → 10 → 15 into a completed round with the right events', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: RX_PLAN });
    perform(director, deps, 'pullup', 0);
    director.start();

    perform(director, deps, 'pullup', 5);
    expect(director.live.get().move).toBe('pushup');
    expect(director.live.get().repsInSet).toBe(0);

    perform(director, deps, 'pushup', 10);
    expect(director.live.get().move).toBe('squat');

    perform(director, deps, 'squat', 15);
    const live = director.live.get();
    expect(live.round).toBe(2);
    expect(live.move).toBe('pullup');
    expect(live.rounds).toBe(1);
    expect(live.leftoverReps).toBe(0);

    const types = deps.events().map((e) => e.type);
    expect(types.filter((t) => t === 'rep-counted')).toHaveLength(30);
    expect(types.filter((t) => t === 'set-completed')).toHaveLength(3);
    expect(types.filter((t) => t === 'round-completed')).toHaveLength(1);
  });

  it('scores rounds + leftover reps and finishes when the clock runs out', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: RX_PLAN });
    perform(director, deps, 'pullup', 0);
    director.start();
    perform(director, deps, 'pullup', 5);
    perform(director, deps, 'pushup', 4);
    expect(director.live.get().leftoverReps).toBe(9);

    deps.advance(CINDY.durationMs);
    director.tick();
    const finished = deps.events().find((e) => e.type === 'session-finished');
    expect(finished).toMatchObject({
      rounds: 0,
      leftoverReps: 9,
      early: false,
      repsCounted: 9,
      repsManual: 0,
    });
    expect(director.live.get().phase).toBe('finished');
    expect(deps.events().some((e) => e.type === 'session-pose-captured')).toBe(true);
  });

  it('records a manual +1 separately and still advances the set', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: SCALED_PLAN });
    perform(director, deps, 'pullup', 0);
    director.start();
    perform(director, deps, 'pullup', 4);
    director.addManualRep();
    expect(director.live.get().move).toBe('pushup');
    director.finish(true);
    const finished = deps.events().find((e) => e.type === 'session-finished');
    expect(finished).toMatchObject({ repsCounted: 4, repsManual: 1, leftoverReps: 5, early: true });
  });

  it('pauses the clock and does not count while paused', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: RX_PLAN });
    perform(director, deps, 'pullup', 0);
    director.start();
    director.pause();
    const before = director.live.get().remainingMs;
    perform(director, deps, 'pullup', 3);
    director.tick();
    expect(director.live.get().remainingMs).toBe(before);
    expect(deps.events().filter((e) => e.type === 'rep-counted')).toHaveLength(0);
    director.resume();
    expect(deps.events().map((e) => e.type)).toContain('session-resumed');
  });

  it('mutes detectors while framing is lost and accrues framingLostMs', () => {
    const deps = testDeps();
    const director = new WorkoutDirector(deps);
    director.prepare({ sessionId: 's1', plan: RX_PLAN });
    perform(director, deps, 'pullup', 0);
    director.start();
    const t0 = deps.clock();
    for (let i = 0; i < 30; i += 1) {
      director.onFrame({ tMs: t0 + i * 33, width: 1, height: 1, joints: {} });
    }
    expect(director.live.get().framing).toBe('no-body');
    director.finish(true);
    const finished = deps.events().find((e) => e.type === 'session-finished');
    expect(finished).toMatchObject({ repsCounted: 0 });
    expect((finished as { framingLostMs: number }).framingLostMs).toBeGreaterThan(300);
  });
});

describe('AmrapClock', () => {
  it('excludes paused time from elapsed', () => {
    const clock = new AmrapClock(60_000);
    clock.start(0);
    clock.pause(10_000);
    clock.resume(25_000);
    expect(clock.elapsed(30_000)).toBe(15_000);
    expect(clock.remaining(30_000)).toBe(45_000);
    expect(clock.isOver(80_000)).toBe(true);
  });

  it('formats mm:ss with a ceiling so 19:59.2 reads 20:00', () => {
    expect(formatClock(20 * 60 * 1000)).toBe('20:00');
    expect(formatClock(19 * 60 * 1000 + 59_200)).toBe('20:00');
    expect(formatClock(61_000)).toBe('01:01');
    expect(formatClock(0)).toBe('00:00');
  });
});

describe('scoring', () => {
  it('counts completed rounds and leftover reps across sets', () => {
    expect(scoreFrom(CINDY, 3, 1, 4)).toEqual({ rounds: 2, leftoverReps: 9 });
    expect(scoreFrom(CINDY, 1, 0, 0)).toEqual({ rounds: 0, leftoverReps: 0 });
    expect(formatScore(11, 4)).toBe('11 + 4');
    expect(formatScore(11, 0)).toBe('11');
  });
});
