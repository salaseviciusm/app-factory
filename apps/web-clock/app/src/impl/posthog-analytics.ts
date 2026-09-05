import type { AnalyticsClient, AnalyticsEnvelope, AnalyticsProps } from '@factory/analytics';
import PostHog from 'posthog-react-native';

/**
 * The only file that speaks PostHog. Anonymous device id, no person profiles, no
 * session replay, no autocapture: the pilot needs funnel counts, not people.
 */
export class PostHogAnalytics implements AnalyticsClient {
  private readonly client: PostHog;

  constructor(
    apiKey: string,
    host: string,
    private readonly envelope: AnalyticsEnvelope,
  ) {
    this.client = new PostHog(apiKey, {
      host,
      captureAppLifecycleEvents: false,
      disableGeoip: true,
      personProfiles: 'never',
      flushAt: 10,
      flushInterval: 15_000,
    });
  }

  track(event: string, props: AnalyticsProps = {}): void {
    this.client.capture(event, { ...this.envelope, ...props });
  }
}
