// @factory/core — hand-curated barrel. Explicit named exports only; no `export *`.

// Events
export { baseEventSchema, defineEvent } from './events/base-event.js';
export type { BaseEvent, NewId, Clock, EventDefinition, EventOf } from './events/base-event.js';
export { InMemoryEventBus } from './events/event-bus.js';
export type { EventBus, Subscription, Handler } from './events/event-bus.js';
export { InMemoryEventStore, persistPublishedEvents } from './events/event-store.js';
export type { EventStore } from './events/event-store.js';

// Query / projections
export { foldEvents, defineProjection } from './query/projection.js';
export type { Projection } from './query/projection.js';

// Entitlements seam
export { GrantAllEntitlements, StaticEntitlements } from './entitlements/entitlements.js';
export type { Entitlements } from './entitlements/entitlements.js';
