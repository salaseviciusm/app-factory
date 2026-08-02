import type { BaseEvent } from '../events/base-event.js';
import type { EventStore } from '../events/event-store.js';

/**
 * Reads are projections that re-fold the log — never mutable mirrors that can
 * drift. When a fold starts hurting on a large store, add caching INSIDE the
 * projection; the interface holds. See ADR 0001.
 */
export function foldEvents<E extends BaseEvent, S>(
  events: readonly E[],
  initial: S,
  reduce: (state: S, event: E) => S,
): S {
  let state = initial;
  for (const event of events) {
    state = reduce(state, event);
  }
  return state;
}

/** A named, reusable projection over a store. */
export interface Projection<E extends BaseEvent, S> {
  readonly name: string;
  run(store: EventStore<E>): S;
}

export function defineProjection<E extends BaseEvent, S>(
  name: string,
  initial: () => S,
  reduce: (state: S, event: E) => S,
): Projection<E, S> {
  return {
    name,
    run(store: EventStore<E>): S {
      return foldEvents(store.read(), initial(), reduce);
    },
  };
}
