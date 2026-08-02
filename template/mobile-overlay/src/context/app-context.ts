/**
 * THE composition root — the only file in the app allowed to instantiate concrete
 * implementations. Swapping any impl must touch only its adapter plus one line here.
 *
 * Wiring order matters: persistence first — every published event lands on the log
 * before any other reaction sees it.
 */
import {
  GrantAllEntitlements,
  InMemoryEventBus,
  InMemoryEventStore,
  persistPublishedEvents,
  type Clock,
  type Entitlements,
  type EventBus,
  type EventStore,
  type NewId,
} from '@factory/core';
import { NoopAnalytics, type AnalyticsClient } from '@factory/analytics';

export interface AppContext {
  newId: NewId;
  clock: Clock;
  bus: EventBus;
  store: EventStore;
  entitlements: Entitlements;
  analytics: AnalyticsClient;
}

function createAppContext(): AppContext {
  // Ports. Swap-ins land here as the app grows:
  //   newId  -> impl/expo-crypto-ids.ts (expo-crypto randomUUID)
  //   store  -> impl/sqlite-event-store.ts (persistent), decorated by sync when needed
  //   analytics -> impl/posthog-analytics.ts once O2 is resolved and the app opts in
  //   entitlements -> impl/revenuecat-entitlements.ts per features.json monetization
  const newId: NewId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const clock: Clock = () => Date.now();

  const store = new InMemoryEventStore();
  const bus = new InMemoryEventBus();
  persistPublishedEvents(bus, store); // must precede every other subscription

  const entitlements: Entitlements = new GrantAllEntitlements(); // dev default
  const analytics: AnalyticsClient = new NoopAnalytics(); // dev default

  return { newId, clock, bus, store, entitlements, analytics };
}

/** Module-level singleton, imported directly (no React Context provider — ADR 0002). */
export const appContext: AppContext = createAppContext();
