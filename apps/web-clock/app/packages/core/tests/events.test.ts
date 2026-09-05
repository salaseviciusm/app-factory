import { describe, expect, it } from 'vitest';
import { InMemoryEventBus, InMemoryEventStore, persistPublishedEvents } from '../src/index.js';
import { counterIncremented, counterReset, testDeps, type CounterEvent } from './helpers.js';

describe('defineEvent', () => {
  it('fills the envelope from ports and validates on write', () => {
    const deps = testDeps();
    const event = counterIncremented.create(deps, { amount: 3 });
    expect(event).toMatchObject({
      id: 'id-1',
      type: 'counter-value-incremented',
      schemaVersion: 1,
      amount: 3,
    });
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('rejects malformed payloads before they can reach the log', () => {
    const deps = testDeps();
    expect(() => counterIncremented.create(deps, { amount: 1.5 as unknown as number })).toThrow();
  });
});

describe('InMemoryEventBus', () => {
  it('delivers typed subscriptions only for their type', () => {
    const bus = new InMemoryEventBus<CounterEvent>();
    const deps = testDeps();
    const seen: string[] = [];
    bus.subscribe('counter-value-incremented', (e) => seen.push(`${e.type}:${e.amount}`));

    bus.publish(counterIncremented.create(deps, { amount: 2 }));
    bus.publish(counterReset.create(deps, {}));

    expect(seen).toEqual(['counter-value-incremented:2']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = new InMemoryEventBus<CounterEvent>();
    const deps = testDeps();
    let count = 0;
    const sub = bus.subscribeAll(() => count++);
    bus.publish(counterReset.create(deps, {}));
    sub.unsubscribe();
    bus.publish(counterReset.create(deps, {}));
    expect(count).toBe(1);
  });
});

describe('persistPublishedEvents', () => {
  it('lands every event on the log before typed subscribers react', () => {
    const bus = new InMemoryEventBus<CounterEvent>();
    const store = new InMemoryEventStore<CounterEvent>();
    const deps = testDeps();
    persistPublishedEvents(bus, store);

    let logLengthWhenTypedHandlerRan = -1;
    bus.subscribe('counter-value-incremented', () => {
      logLengthWhenTypedHandlerRan = store.read().length;
    });

    bus.publish(counterIncremented.create(deps, { amount: 1 }));

    // Persistence-first: the typed handler already sees the event in the store.
    expect(logLengthWhenTypedHandlerRan).toBe(1);
    expect(store.read()).toHaveLength(1);
  });
});

describe('InMemoryEventStore', () => {
  it('reads by timestamp range', () => {
    const store = new InMemoryEventStore<CounterEvent>();
    const deps = testDeps();
    const a = counterIncremented.create(deps, { amount: 1 }); // t=1001
    const b = counterIncremented.create(deps, { amount: 2 }); // t=1002
    const c = counterIncremented.create(deps, { amount: 3 }); // t=1003
    store.append([a, b, c]);

    expect(store.read({ from: b.timestamp, to: b.timestamp })).toEqual([b]);
    expect(store.read({ from: b.timestamp })).toEqual([b, c]);
    expect(store.read()).toHaveLength(3);
  });
});
