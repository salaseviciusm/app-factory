import { useSyncExternalStore } from 'react';
import type { Cell } from './observable';

/** React binding for Cell — the only way screens read live state (ADR 0002). */
export function useCell<T>(cell: Cell<T>): T {
  return useSyncExternalStore(
    (onChange) => cell.subscribe(onChange),
    () => cell.get(),
    () => cell.get(),
  );
}
