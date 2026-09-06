import type { Move } from '../detectors/detector.js';

export interface WorkoutSet {
  readonly move: Move;
  readonly reps: number;
}

export interface Workout {
  readonly id: string;
  readonly name: string;
  readonly durationMs: number;
  readonly sets: readonly WorkoutSet[];
}

/** The benchmark: 20:00 AMRAP of 5 pull-ups / 10 push-ups / 15 air squats. */
export const CINDY: Workout = {
  id: 'cindy-20',
  name: 'Cindy',
  durationMs: 20 * 60 * 1000,
  sets: [
    { move: 'pullup', reps: 5 },
    { move: 'pushup', reps: 10 },
    { move: 'squat', reps: 15 },
  ],
};

export const REPS_PER_ROUND = CINDY.sets.reduce((n, s) => n + s.reps, 0);

export const MOVE_LABEL: Record<Move, string> = {
  pullup: 'Pull-ups',
  pushup: 'Push-ups',
  squat: 'Squats',
  row: 'Inverted rows',
};

/** Score components from a position in the workout. */
export function scoreFrom(
  workout: Workout,
  round: number,
  setIndex: number,
  repsInSet: number,
): { rounds: number; leftoverReps: number } {
  let leftover = repsInSet;
  for (let i = 0; i < setIndex; i += 1) {
    leftover += workout.sets[i]?.reps ?? 0;
  }
  return { rounds: round - 1, leftoverReps: leftover };
}

export function formatScore(rounds: number, leftoverReps: number): string {
  return leftoverReps > 0 ? `${rounds} + ${leftoverReps}` : `${rounds}`;
}
