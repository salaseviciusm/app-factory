/**
 * Analytics seam. Rules (playbooks/analytics-taxonomy.md):
 * - events are defined at design time; an event not in the spec doesn't ship
 * - names are `category-entity-action`, lowercase-hyphenated
 * - no PII, no free-text properties
 * - provider adapters (PostHog etc.) implement AnalyticsClient in the app shell;
 *   features only ever see `track`
 */

/** Standard events every app emits — wired by the template, not by features. */
export const standardAnalyticsEvents = [
  'app-session-started',
  'onboarding-step-viewed',
  'onboarding-step-completed',
  'onboarding-step-skipped',
  'onboarding-completed',
  'paywall-viewed',
  'paywall-dismissed',
  'purchase-started',
  'purchase-completed',
  'purchase-failed',
  'settings-changed',
  'review-prompt-shown',
  'review-prompt-accepted',
  'error-displayed',
] as const;

export type StandardAnalyticsEvent = (typeof standardAnalyticsEvents)[number];

/** Property values are scalars only — no nesting, no free text blobs, no PII. */
export type AnalyticsProps = Readonly<Record<string, string | number | boolean>>;

/** Filled by the shell adapter on every event; features never set these. */
export interface AnalyticsEnvelope {
  readonly appId: string;
  readonly appVersion: string;
  readonly templateVersion: string;
  readonly brandId: string;
  readonly platform: 'ios' | 'android';
  readonly sessionId: string;
}

export interface AnalyticsClient<TEvent extends string = string> {
  track(event: TEvent | StandardAnalyticsEvent, props?: AnalyticsProps): void;
}

/** No-op client: development default and free-tier apps that opt out. */
export class NoopAnalytics implements AnalyticsClient {
  track(): void {
    // intentionally empty
  }
}

/** In-memory recorder: tests assert on emitted events instead of mocking. */
export class RecordingAnalytics<TEvent extends string = string> implements AnalyticsClient<TEvent> {
  readonly events: Array<{ event: string; props: AnalyticsProps }> = [];

  track(event: TEvent | StandardAnalyticsEvent, props: AnalyticsProps = {}): void {
    this.events.push({ event, props });
  }
}

const eventNamePattern = /^[a-z0-9]+(-[a-z0-9]+)+$/;

/** Compile-time helper for per-app event sets; validates naming at definition time. */
export function defineAnalyticsEvents<const T extends readonly string[]>(events: T): T {
  for (const event of events) {
    if (!eventNamePattern.test(event)) {
      throw new Error(
        `Analytics event "${event}" must be category-entity-action, lowercase-hyphenated`,
      );
    }
  }
  return events;
}
