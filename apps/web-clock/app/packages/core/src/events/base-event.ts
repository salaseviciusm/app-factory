import { z } from 'zod';

/**
 * Every durable fact in an app is an event with this envelope. The log is
 * append-only: nothing is updated or deleted — corrections are new events.
 */
export const baseEventSchema = z.object({
  /** Unique id. Generated via the NewId port — core never touches crypto APIs. */
  id: z.string().min(1),
  /** Epoch milliseconds. Core is platform-free, so callers supply time via the Clock port. */
  timestamp: z.number().int().nonnegative(),
  /** Version of this event type's schema; bump on shape change, never mutate old events. */
  schemaVersion: z.number().int().positive(),
  /** Discriminant, `category-entity-action`, lowercase-hyphenated. */
  type: z.string().min(1),
});

export type BaseEvent = z.infer<typeof baseEventSchema>;

/** Ports the shell provides at the composition root. */
export type NewId = () => string;
export type Clock = () => number;

/**
 * Define an app event type: pins the `type` literal and `schemaVersion`, and returns
 * the schema plus a factory that fills the envelope from the shell-provided ports.
 *
 * const skipDetected = defineEvent('session-skip-detected', 1, {
 *   sessionId: z.string(),
 *   detectorVersion: z.string(),
 * });
 */
export function defineEvent<const TType extends string, TShape extends z.ZodRawShape>(
  type: TType,
  schemaVersion: number,
  shape: TShape,
): EventDefinition<TType, TShape> {
  // Zod's generic .extend() output doesn't structurally unify with EventOf<> inside
  // a generic function; the runtime shape is exactly EventOf, so cast once here.
  const schema = baseEventSchema.extend({
    type: z.literal(type),
    ...shape,
  }) as unknown as z.ZodType<EventOf<TType, TShape>>;
  return {
    type,
    schemaVersion,
    schema,
    create(deps: { newId: NewId; clock: Clock }, payload) {
      const event = {
        id: deps.newId(),
        timestamp: deps.clock(),
        schemaVersion,
        type,
        ...payload,
      };
      // Validate on write — a malformed event must never reach the log.
      return schema.parse(event);
    },
  };
}

export interface EventDefinition<TType extends string, TShape extends z.ZodRawShape> {
  readonly type: TType;
  readonly schemaVersion: number;
  readonly schema: z.ZodType<EventOf<TType, TShape>>;
  create(
    deps: { newId: NewId; clock: Clock },
    payload: z.infer<z.ZodObject<TShape>>,
  ): EventOf<TType, TShape>;
}

export type EventOf<TType extends string, TShape extends z.ZodRawShape> = BaseEvent & {
  type: TType;
} & z.infer<z.ZodObject<TShape>>;
