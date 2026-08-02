import type { Subscription } from '../events/event-bus.js';

/**
 * The ONE seam all pro-gating reads. Never scatter `isPro` flags through features —
 * gate through this interface so the RevenueCat adapter (shell impl/) is swappable
 * and offline grace is handled in exactly one place.
 */
export interface Entitlements {
  /** Entitlements are named by capability ('pro'), not by price point. */
  has(entitlement: string): boolean;
  subscribe(onChange: () => void): Subscription;
}

/** Everything unlocked — development, tests, and free-only apps. */
export class GrantAllEntitlements implements Entitlements {
  has(): boolean {
    return true;
  }
  subscribe(): Subscription {
    return { unsubscribe: () => undefined };
  }
}

/** Fixed set — tests and previews. */
export class StaticEntitlements implements Entitlements {
  constructor(private readonly granted: readonly string[]) {}
  has(entitlement: string): boolean {
    return this.granted.includes(entitlement);
  }
  subscribe(): Subscription {
    return { unsubscribe: () => undefined };
  }
}
