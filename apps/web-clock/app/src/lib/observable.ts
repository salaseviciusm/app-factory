/**
 * Minimal observable primitives for high-frequency live state (per-tick UI values,
 * sensor-ish streams). This state deliberately BYPASSES the event system — the log is
 * for durable facts, not 60Hz signals. See ADR 0002 and skip-hero's precedent.
 */

export type Unsubscribe = () => void;

export class Cell<T> {
  private listeners = new Set<(value: T) => void>();

  constructor(private value: T) {}

  get(): T {
    return this.value;
  }

  set(next: T): void {
    if (Object.is(next, this.value)) {
      return;
    }
    this.value = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  subscribe(listener: (value: T) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/* React binding (add in the app, where react is a dependency):

import { useSyncExternalStore } from 'react';
export function useCell<T>(cell: Cell<T>): T {
  return useSyncExternalStore(
    (onChange) => cell.subscribe(onChange),
    () => cell.get(),
  );
}
*/
