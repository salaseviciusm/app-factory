import { useEffect, useState } from 'react';
import { appContext } from '../context/app-context';
import type { WorkoutEvent } from '../domain/workout/events';

/**
 * The log as React state: re-renders after every published event. Screens fold it
 * with a projection — reads are always a fold, never a mirror (ADR 0001).
 */
export function useEvents(): readonly WorkoutEvent[] {
  const [events, setEvents] = useState(() => appContext.events());
  useEffect(() => {
    const subscription = appContext.bus.subscribeAll(() => setEvents(appContext.events()));
    return () => subscription.unsubscribe();
  }, []);
  return events;
}
