import { z } from 'zod';
import { defineEvent, type Clock, type NewId } from '../src/index.js';

/** Deterministic ports for tests. */
export function testDeps(): { newId: NewId; clock: Clock } {
  let id = 0;
  let now = 1_000;
  return {
    newId: () => `id-${++id}`,
    clock: () => (now += 1),
  };
}

/** A minimal app event set used across core tests. */
export const counterIncremented = defineEvent('counter-value-incremented', 1, {
  amount: z.number().int(),
});
export const counterReset = defineEvent('counter-value-reset', 1, {});

export type CounterEvent =
  ReturnType<typeof counterIncremented.create> | ReturnType<typeof counterReset.create>;
