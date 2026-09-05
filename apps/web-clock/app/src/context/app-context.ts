/**
 * THE composition root — the only file in the app allowed to instantiate concrete
 * implementations. Swapping any impl must touch only its adapter plus one line here.
 *
 * Wiring order matters: persistence first — every published event lands on the log
 * before any other reaction sees it.
 */
import { NoopAnalytics, type AnalyticsClient } from '@factory/analytics';
import {
  GrantAllEntitlements,
  InMemoryEventBus,
  persistPublishedEvents,
  type Clock,
  type Entitlements,
  type EventBus,
  type NewId,
} from '@factory/core';
import { nativeApplicationVersion, applicationId } from 'expo-application';
import { openDatabaseSync } from 'expo-sqlite';
import factory from '../../factory.json';
import clipB from '../../fixtures/pullup/clip-b.json';
import { bridgeAnalytics } from '../domain/analytics/events';
import { ChallengeService } from '../domain/challenge/challenge-service';
import type { PoseFixture } from '../domain/pose/fixture';
import type { PoseSource, PoseSourceKind } from '../domain/pose/pose-source';
import { foldSettings } from '../domain/projections/settings';
import { WorkoutDirector } from '../domain/workout/director';
import type { WorkoutEvent } from '../domain/workout/events';
import { expoCryptoIds } from '../impl/expo-crypto-ids';
import { FixturePoseSource } from '../impl/fixture-pose-source';
import { LivePoseSource } from '../impl/live-pose-source';
import { PostHogAnalytics } from '../impl/posthog-analytics';
import { SimPoseSource } from '../impl/sim-pose-source';
import { SqliteEventStore } from '../impl/sqlite-event-store';
import { Cell } from '../lib/observable';

export interface AppContext {
  newId: NewId;
  clock: Clock;
  bus: EventBus<WorkoutEvent>;
  store: SqliteEventStore<WorkoutEvent>;
  entitlements: Entitlements;
  analytics: AnalyticsClient;
  director: WorkoutDirector;
  /** Which pose source the next session uses. Live when the camera module is linked. */
  poseSourceKind: Cell<PoseSourceKind>;
  createPoseSource(): PoseSource;
  /** Latest camera/vision error, for the session screen to surface. */
  cameraError: Cell<string | undefined>;
  /** Re-fold the log; screens call this in their projections. */
  events(): readonly WorkoutEvent[];
}

function createAppContext(): AppContext {
  const newId: NewId = expoCryptoIds;
  const clock: Clock = () => Date.now();

  const store = new SqliteEventStore<WorkoutEvent>(openDatabaseSync('suit-up.db'));
  const bus = new InMemoryEventBus<WorkoutEvent>();
  persistPublishedEvents(bus, store); // must precede every other subscription

  // v1.0 ships free (decision P8): the seam stays, nothing is gated.
  const entitlements: Entitlements = new GrantAllEntitlements();

  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const analytics: AnalyticsClient = posthogKey
    ? new PostHogAnalytics(
        posthogKey,
        process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
        {
          appId: applicationId ?? 'com.salaseviciusm.suitup',
          appVersion: nativeApplicationVersion ?? '0.0.0',
          templateVersion: factory.templateVersion,
          brandId: 'suit-up',
          platform: 'ios',
          sessionId: newId(),
        },
      )
    : new NoopAnalytics();
  bridgeAnalytics(bus, analytics);

  const director = new WorkoutDirector({ bus, newId, clock });
  new ChallengeService({ bus, store, newId, clock }).start();

  const cameraError = new Cell<string | undefined>(undefined);
  const poseSourceKind = new Cell<PoseSourceKind>(LivePoseSource.available() ? 'live' : 'sim');

  const createPoseSource = (): PoseSource => {
    switch (poseSourceKind.get()) {
      case 'live':
        return new LivePoseSource(
          () => foldSettings(store.read()).camera,
          (message) => cameraError.set(message),
        );
      case 'fixture':
        return new FixturePoseSource(clipB as unknown as PoseFixture);
      case 'sim':
        return new SimPoseSource(() => director.live.get().move);
    }
  };

  return {
    newId,
    clock,
    bus,
    store,
    entitlements,
    analytics,
    director,
    poseSourceKind,
    createPoseSource,
    cameraError,
    events: () => store.read(),
  };
}

/** Module-level singleton, imported directly (no React Context provider — ADR 0002). */
export const appContext: AppContext = createAppContext();
