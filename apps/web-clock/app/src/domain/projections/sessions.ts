import type { Move, RejectReason, VariantPlan } from '../detectors/detector.js';
import type { WorkoutEvent } from '../workout/events.js';

export interface SessionSummary {
  readonly sessionId: string;
  readonly startedAt: number;
  readonly finishedAt: number | undefined;
  readonly challengeId: string | undefined;
  readonly dayIndex: number | undefined;
  readonly plan: VariantPlan;
  readonly targetRounds: number | undefined;
  readonly rounds: number;
  readonly leftoverReps: number;
  readonly repsCounted: number;
  readonly repsManual: number;
  readonly repsRejected: number;
  readonly rejectsByReason: Readonly<Partial<Record<RejectReason, number>>>;
  readonly repsByMove: Readonly<Record<Move, number>>;
  readonly early: boolean;
  readonly abandoned: boolean;
  readonly durationMs: number;
  readonly framingLostMs: number;
  readonly pose:
    | { readonly move: Move; readonly joints: ReadonlyArray<readonly [string, number, number]> }
    | undefined;
}

/** Every session that ever started, keyed by id, in start order. */
export function foldSessions(events: readonly WorkoutEvent[]): Map<string, SessionSummary> {
  const sessions = new Map<string, SessionSummary>();
  for (const event of events) {
    switch (event.type) {
      case 'data-erased':
        sessions.clear();
        break;
      case 'session-started':
        sessions.set(event.sessionId, {
          sessionId: event.sessionId,
          startedAt: event.timestamp,
          finishedAt: undefined,
          challengeId: event.challengeId,
          dayIndex: event.dayIndex,
          plan: event.plan,
          targetRounds: event.targetRounds,
          rounds: 0,
          leftoverReps: 0,
          repsCounted: 0,
          repsManual: 0,
          repsRejected: 0,
          rejectsByReason: {},
          repsByMove: { pullup: 0, pushup: 0, squat: 0 },
          early: false,
          abandoned: false,
          durationMs: 0,
          framingLostMs: 0,
          pose: undefined,
        });
        break;
      case 'rep-counted':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          repsCounted: s.repsCounted + 1,
          repsByMove: { ...s.repsByMove, [event.move]: s.repsByMove[event.move] + 1 },
        }));
        break;
      case 'rep-added-manually':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          repsManual: s.repsManual + 1,
          repsByMove: { ...s.repsByMove, [event.move]: s.repsByMove[event.move] + 1 },
        }));
        break;
      case 'rep-rejected':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          repsRejected: s.repsRejected + 1,
          rejectsByReason: {
            ...s.rejectsByReason,
            [event.reason]: (s.rejectsByReason[event.reason] ?? 0) + 1,
          },
        }));
        break;
      case 'session-pose-captured':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          pose: { move: event.move, joints: event.joints },
        }));
        break;
      case 'session-finished':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          finishedAt: event.timestamp,
          rounds: event.rounds,
          leftoverReps: event.leftoverReps,
          early: event.early,
          durationMs: event.durationMs,
          framingLostMs: event.framingLostMs,
        }));
        break;
      case 'session-abandoned':
        update(sessions, event.sessionId, (s) => ({
          ...s,
          abandoned: true,
          finishedAt: event.timestamp,
        }));
        break;
      default:
        break;
    }
  }
  return sessions;
}

function update(
  sessions: Map<string, SessionSummary>,
  id: string,
  fn: (s: SessionSummary) => SessionSummary,
): void {
  const current = sessions.get(id);
  if (current) {
    sessions.set(id, fn(current));
  }
}

/** Finished (not abandoned) sessions, newest first. */
export function finishedSessions(events: readonly WorkoutEvent[]): SessionSummary[] {
  return [...foldSessions(events).values()]
    .filter((s) => s.finishedAt !== undefined && !s.abandoned)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
}

export function sessionById(
  events: readonly WorkoutEvent[],
  sessionId: string,
): SessionSummary | undefined {
  return foldSessions(events).get(sessionId);
}

export function personalBest(sessions: readonly SessionSummary[]): SessionSummary | undefined {
  let best: SessionSummary | undefined;
  for (const s of sessions) {
    if (s.early) {
      continue;
    }
    if (
      !best ||
      s.rounds > best.rounds ||
      (s.rounds === best.rounds && s.leftoverReps > best.leftoverReps)
    ) {
      best = s;
    }
  }
  return best;
}
