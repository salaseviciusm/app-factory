import { describe, expect, it } from 'vitest';
import { defineAnalyticsEvents, RecordingAnalytics } from '../src/index.js';

describe('defineAnalyticsEvents', () => {
  it('accepts category-entity-action names', () => {
    const events = defineAnalyticsEvents(['run-first-completed', 'milestone-10-reached']);
    expect(events).toHaveLength(2);
  });

  it('rejects names that break the convention', () => {
    expect(() => defineAnalyticsEvents(['RunCompleted'])).toThrow();
    expect(() => defineAnalyticsEvents(['run_completed'])).toThrow();
    expect(() => defineAnalyticsEvents(['run'])).toThrow(); // needs ≥2 segments
  });
});

describe('RecordingAnalytics', () => {
  it('captures typed events for test assertions', () => {
    const events = defineAnalyticsEvents(['run-first-completed']);
    const analytics = new RecordingAnalytics<(typeof events)[number]>();
    analytics.track('run-first-completed', { 'duration-s': 42 });
    analytics.track('paywall-viewed', { placement: 'post-run', variant: 'a' });

    expect(analytics.events).toEqual([
      { event: 'run-first-completed', props: { 'duration-s': 42 } },
      { event: 'paywall-viewed', props: { placement: 'post-run', variant: 'a' } },
    ]);
  });
});
