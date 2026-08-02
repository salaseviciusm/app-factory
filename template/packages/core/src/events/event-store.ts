import type { BaseEvent } from './base-event.js';
import type { EventBus, Subscription } from './event-bus.js';

/**
 * Append-only log. Kept to two methods so a sync layer can be a pure decorator.
 * Implementations: InMemoryEventStore (here, ships in src — not test-only),
 * platform stores (SQLite/MMKV) live in the app shell's impl/ folder.
 */
export interface EventStore<E extends BaseEvent = BaseEvent> {
  append(events: readonly E[]): void;
  read(range?: { from?: number; to?: number }): readonly E[];
}

export class InMemoryEventStore<E extends BaseEvent = BaseEvent> implements EventStore<E> {
  private readonly log: E[] = [];

  append(events: readonly E[]): void {
    this.log.push(...events);
  }

  read(range?: { from?: number; to?: number }): readonly E[] {
    if (!range) {
      return [...this.log];
    }
    const from = range.from ?? 0;
    const to = range.to ?? Number.MAX_SAFE_INTEGER;
    return this.log.filter((e) => e.timestamp >= from && e.timestamp <= to);
  }
}

/**
 * Wire persistence-first: every published event is appended to the store via a
 * catch-all subscription registered before any other subscriber. Call this at the
 * composition root immediately after constructing the bus, before anything else
 * subscribes.
 */
export function persistPublishedEvents<E extends BaseEvent>(
  bus: EventBus<E>,
  store: EventStore<E>,
): Subscription {
  return bus.subscribeAll((event) => store.append([event]));
}
