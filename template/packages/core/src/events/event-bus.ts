import type { BaseEvent } from './base-event.js';

export interface Subscription {
  unsubscribe(): void;
}

export type Handler<E> = (event: E) => void;

/**
 * Typed pub/sub for domain events. High-frequency live signals (sensor frames,
 * per-tick UI state) do NOT go through here — use the observable Cell/Stream in the
 * shell instead. See ADR 0002.
 */
export interface EventBus<E extends BaseEvent = BaseEvent> {
  publish(event: E): void;
  subscribe<T extends E['type']>(type: T, handler: Handler<Extract<E, { type: T }>>): Subscription;
  /** Catch-all; used by persistence and projections. */
  subscribeAll(handler: Handler<E>): Subscription;
}

export class InMemoryEventBus<E extends BaseEvent = BaseEvent> implements EventBus<E> {
  private readonly byType = new Map<string, Set<Handler<E>>>();
  private readonly all = new Set<Handler<E>>();

  publish(event: E): void {
    // Catch-all subscribers run first: persistence is registered there, and every
    // event must land on the log before any typed reaction sees it.
    for (const handler of this.all) {
      handler(event);
    }
    const handlers = this.byType.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  subscribe<T extends E['type']>(type: T, handler: Handler<Extract<E, { type: T }>>): Subscription {
    const set = this.byType.get(type) ?? new Set<Handler<E>>();
    const wide = handler as Handler<E>;
    set.add(wide);
    this.byType.set(type, set);
    return { unsubscribe: () => set.delete(wide) };
  }

  subscribeAll(handler: Handler<E>): Subscription {
    this.all.add(handler);
    return { unsubscribe: () => this.all.delete(handler) };
  }
}
