import { describe, expect, it } from 'vitest';
import { defineProjection, InMemoryEventStore } from '../src/index.js';
import { counterIncremented, counterReset, testDeps, type CounterEvent } from './helpers.js';

const counterTotal = defineProjection<CounterEvent, number>(
  'counter-total',
  () => 0,
  (state, event) => {
    switch (event.type) {
      case 'counter-value-incremented':
        return state + event.amount;
      case 'counter-value-reset':
        return 0;
    }
  },
);

describe('projections', () => {
  it('re-folds the log on every run — no cached mutable state to drift', () => {
    const store = new InMemoryEventStore<CounterEvent>();
    const deps = testDeps();

    store.append([counterIncremented.create(deps, { amount: 2 })]);
    expect(counterTotal.run(store)).toBe(2);

    store.append([
      counterIncremented.create(deps, { amount: 5 }),
      counterReset.create(deps, {}),
      counterIncremented.create(deps, { amount: 1 }),
    ]);
    expect(counterTotal.run(store)).toBe(1);
  });

  it('is deterministic: same log, same result', () => {
    const store = new InMemoryEventStore<CounterEvent>();
    const deps = testDeps();
    store.append([
      counterIncremented.create(deps, { amount: 4 }),
      counterIncremented.create(deps, { amount: 6 }),
    ]);
    expect(counterTotal.run(store)).toBe(counterTotal.run(store));
    expect(counterTotal.run(store)).toBe(10);
  });
});
