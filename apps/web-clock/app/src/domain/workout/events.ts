import { defineEvent } from '@factory/core';
import { z } from 'zod';

/**
 * The durable facts. Types are the contract; payloads are minimal. Detector-produced
 * events carry the detector id so a retune never rewrites history.
 */

const move = z.enum(['pullup', 'pushup', 'squat', 'row']);
const variant = z.enum(['rx', 'jumping', 'knee', 'box']);
const rejectReason = z.enum([
  'hang-short',
  'chin-below-bar',
  'lockout-short',
  'depth-short',
  'tempo-too-fast',
  'low-confidence',
  'framing-lost',
]);
const variantPlan = z.object({
  pullup: z.enum(['rx', 'jumping']),
  pushup: z.enum(['rx', 'knee']),
  squat: z.enum(['rx', 'box']),
});
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const challengeStarted = defineEvent('challenge-started', 1, {
  challengeId: z.string(),
  kind: z.literal('winter-arc-30'),
  startDate: isoDate,
  days: z.number().int().positive(),
  minSessionsPerWeek: z.number().int().positive(),
  plan: variantPlan,
});

export const challengeAbandoned = defineEvent('challenge-abandoned', 1, {
  challengeId: z.string(),
});

export const sessionStarted = defineEvent('session-started', 1, {
  sessionId: z.string(),
  challengeId: z.string().optional(),
  dayIndex: z.number().int().positive().optional(),
  workout: z.string(),
  plan: variantPlan,
  targetRounds: z.number().int().positive().optional(),
});

export const repCounted = defineEvent('rep-counted', 1, {
  sessionId: z.string(),
  move,
  variant,
  detectorId: z.string(),
  round: z.number().int().positive(),
  indexInSet: z.number().int().positive(),
  tMs: z.number().int().nonnegative(),
});

export const repRejected = defineEvent('rep-rejected', 1, {
  sessionId: z.string(),
  move,
  variant,
  detectorId: z.string(),
  reason: rejectReason,
  tMs: z.number().int().nonnegative(),
});

export const repAddedManually = defineEvent('rep-added-manually', 1, {
  sessionId: z.string(),
  move,
  round: z.number().int().positive(),
  indexInSet: z.number().int().positive(),
  tMs: z.number().int().nonnegative(),
});

export const setCompleted = defineEvent('set-completed', 1, {
  sessionId: z.string(),
  move,
  round: z.number().int().positive(),
  tMs: z.number().int().nonnegative(),
});

export const roundCompleted = defineEvent('round-completed', 1, {
  sessionId: z.string(),
  round: z.number().int().positive(),
  tMs: z.number().int().nonnegative(),
});

export const sessionPaused = defineEvent('session-paused', 1, {
  sessionId: z.string(),
  tMs: z.number().int().nonnegative(),
});

export const sessionResumed = defineEvent('session-resumed', 1, {
  sessionId: z.string(),
  tMs: z.number().int().nonnegative(),
});

export const sessionFinished = defineEvent('session-finished', 1, {
  sessionId: z.string(),
  rounds: z.number().int().nonnegative(),
  leftoverReps: z.number().int().nonnegative(),
  repsCounted: z.number().int().nonnegative(),
  repsManual: z.number().int().nonnegative(),
  repsRejected: z.number().int().nonnegative(),
  early: z.boolean(),
  durationMs: z.number().int().nonnegative(),
  framingLostMs: z.number().int().nonnegative(),
});

export const sessionAbandoned = defineEvent('session-abandoned', 1, {
  sessionId: z.string(),
  tMs: z.number().int().nonnegative(),
});

/** One pose from the session, kept for the share card. Keypoints only, never pixels. */
export const sessionPoseCaptured = defineEvent('session-pose-captured', 1, {
  sessionId: z.string(),
  move,
  joints: z.array(z.tuple([z.string(), z.number(), z.number()])),
});

export const challengeDayLit = defineEvent('challenge-day-lit', 1, {
  challengeId: z.string(),
  dayIndex: z.number().int().positive(),
  sessionId: z.string(),
  date: isoDate,
});

export const challengeCompleted = defineEvent('challenge-completed', 1, {
  challengeId: z.string(),
  daysLit: z.number().int().nonnegative(),
  firstRounds: z.number().int().nonnegative(),
  lastRounds: z.number().int().nonnegative(),
});

export const cardShared = defineEvent('card-shared', 1, {
  sessionId: z.string().optional(),
  challengeId: z.string().optional(),
  kind: z.enum(['day', 'challenge']),
});

export const targetChanged = defineEvent('target-changed', 1, {
  targetRounds: z.number().int().positive(),
});

export const planChanged = defineEvent('plan-changed', 1, {
  plan: variantPlan,
});

export const cameraChanged = defineEvent('camera-changed', 1, {
  facing: z.enum(['front', 'back']),
});

export const dataErased = defineEvent('data-erased', 1, {});

export const eventDefinitions = {
  challengeStarted,
  challengeAbandoned,
  sessionStarted,
  repCounted,
  repRejected,
  repAddedManually,
  setCompleted,
  roundCompleted,
  sessionPaused,
  sessionResumed,
  sessionFinished,
  sessionAbandoned,
  sessionPoseCaptured,
  challengeDayLit,
  challengeCompleted,
  cardShared,
  targetChanged,
  planChanged,
  cameraChanged,
  dataErased,
} as const;

export type ChallengeStartedEvent = ReturnType<typeof challengeStarted.create>;
export type ChallengeAbandonedEvent = ReturnType<typeof challengeAbandoned.create>;
export type SessionStartedEvent = ReturnType<typeof sessionStarted.create>;
export type RepCountedEvent = ReturnType<typeof repCounted.create>;
export type RepRejectedEvent = ReturnType<typeof repRejected.create>;
export type RepAddedManuallyEvent = ReturnType<typeof repAddedManually.create>;
export type SetCompletedEvent = ReturnType<typeof setCompleted.create>;
export type RoundCompletedEvent = ReturnType<typeof roundCompleted.create>;
export type SessionPausedEvent = ReturnType<typeof sessionPaused.create>;
export type SessionResumedEvent = ReturnType<typeof sessionResumed.create>;
export type SessionFinishedEvent = ReturnType<typeof sessionFinished.create>;
export type SessionAbandonedEvent = ReturnType<typeof sessionAbandoned.create>;
export type SessionPoseCapturedEvent = ReturnType<typeof sessionPoseCaptured.create>;
export type ChallengeDayLitEvent = ReturnType<typeof challengeDayLit.create>;
export type ChallengeCompletedEvent = ReturnType<typeof challengeCompleted.create>;
export type CardSharedEvent = ReturnType<typeof cardShared.create>;
export type TargetChangedEvent = ReturnType<typeof targetChanged.create>;
export type PlanChangedEvent = ReturnType<typeof planChanged.create>;
export type CameraChangedEvent = ReturnType<typeof cameraChanged.create>;
export type DataErasedEvent = ReturnType<typeof dataErased.create>;

export type WorkoutEvent =
  | ChallengeStartedEvent
  | ChallengeAbandonedEvent
  | SessionStartedEvent
  | RepCountedEvent
  | RepRejectedEvent
  | RepAddedManuallyEvent
  | SetCompletedEvent
  | RoundCompletedEvent
  | SessionPausedEvent
  | SessionResumedEvent
  | SessionFinishedEvent
  | SessionAbandonedEvent
  | SessionPoseCapturedEvent
  | ChallengeDayLitEvent
  | ChallengeCompletedEvent
  | CardSharedEvent
  | TargetChangedEvent
  | PlanChangedEvent
  | CameraChangedEvent
  | DataErasedEvent;

export type WorkoutEventType = WorkoutEvent['type'];
