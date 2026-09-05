import type { Clock, EventBus, NewId } from '@factory/core';
import { Cell } from '../../lib/observable.js';
import { createDetector } from '../detectors/index.js';
import type { Detector, Move, RejectReason, Variant, VariantPlan } from '../detectors/detector.js';
import { FramingGate, type FramingState } from '../detectors/framing-gate.js';
import { joint, type Joint, type PoseFrame } from '../pose/pose-frame.js';
import { AmrapClock } from './amrap-clock.js';
import { CINDY, scoreFrom, type Workout } from './cindy.js';
import {
  repAddedManually,
  repCounted,
  repRejected,
  roundCompleted,
  sessionAbandoned,
  sessionFinished,
  sessionPaused,
  sessionPoseCaptured,
  sessionResumed,
  sessionStarted,
  setCompleted,
  type WorkoutEvent,
} from './events.js';

export type DirectorPhase = 'idle' | 'framing' | 'ready' | 'running' | 'paused' | 'finished';

export interface SessionStart {
  readonly sessionId: string;
  readonly challengeId?: string;
  readonly dayIndex?: number;
  readonly plan: VariantPlan;
  readonly targetRounds?: number;
}

export interface LiveState {
  readonly phase: DirectorPhase;
  readonly sessionId: string | undefined;
  readonly round: number;
  readonly setIndex: number;
  readonly move: Move;
  readonly variant: Variant;
  readonly repsInSet: number;
  readonly repsTarget: number;
  readonly rounds: number;
  readonly leftoverReps: number;
  readonly framing: FramingState;
  readonly remainingMs: number;
  readonly lastReject: { readonly reason: RejectReason; readonly atMs: number } | undefined;
  readonly lastCountAtMs: number | undefined;
  readonly detectorPhase: string;
  readonly signal: number | undefined;
}

export interface DirectorDeps {
  readonly bus: EventBus<WorkoutEvent>;
  readonly newId: NewId;
  readonly clock: Clock;
}

/**
 * After a set completes the athlete drops off the bar, gets into plank, stands up:
 * motion the next detector would happily read as a rep. Ignore it for this long.
 */
export const TRANSITION_GUARD_MS = 1500;

/** Joints kept for the share card; the rest add nothing to a silhouette. */
const CARD_JOINTS: readonly Joint[] = [
  'nose',
  'neck',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];

/**
 * Runs one session: framing → ready → running (5 → 10 → 15, round after round) →
 * finished. Consumes pose frames at camera rate, publishes only transitions as events,
 * and mirrors the live picture into a Cell for the HUD (ADR 0002). Pure TypeScript
 * with injected time and ids so goldens can drive it deterministically.
 */
export class WorkoutDirector {
  readonly live: Cell<LiveState>;
  /** Latest frame, for the skeleton overlay. Not persisted. */
  readonly pose = new Cell<PoseFrame | undefined>(undefined);

  private readonly clock: AmrapClock;
  private detectors: Detector[] = [];
  private gate: FramingGate;
  private session: SessionStart | undefined;
  private round = 1;
  private setIndex = 0;
  private repsInSet = 0;
  private repsCounted = 0;
  private repsManual = 0;
  private repsRejected = 0;
  private framingLostMs = 0;
  private lastFrameMs: number | undefined;
  private lastCountedFrame: { move: Move; frame: PoseFrame } | undefined;
  private startedAtMs: number | undefined;
  private guardUntilMs: number | undefined;

  constructor(
    private readonly deps: DirectorDeps,
    private readonly workout: Workout = CINDY,
  ) {
    this.clock = new AmrapClock(workout.durationMs);
    this.gate = new FramingGate([]);
    this.live = new Cell<LiveState>(this.snapshot('idle', 'no-body'));
  }

  /** Enter the framing gate for a new session. Nothing is published until start(). */
  prepare(session: SessionStart): void {
    this.session = session;
    this.round = 1;
    this.setIndex = 0;
    this.repsInSet = 0;
    this.repsCounted = 0;
    this.repsManual = 0;
    this.repsRejected = 0;
    this.framingLostMs = 0;
    this.lastFrameMs = undefined;
    this.lastCountedFrame = undefined;
    this.startedAtMs = undefined;
    this.guardUntilMs = undefined;
    this.detectors = this.workout.sets.map((set) => createDetector(set.move, session.plan));
    this.gate = new FramingGate(this.currentDetector().requires);
    this.publishLive('framing', 'no-body');
  }

  start(): void {
    const session = this.requireSession();
    const phase = this.live.get().phase;
    if (phase !== 'ready' && phase !== 'framing') {
      return;
    }
    const now = this.deps.clock();
    this.startedAtMs = now;
    this.clock.start(now);
    this.currentDetector().reset();
    this.deps.bus.publish(
      sessionStarted.create(this.deps, {
        sessionId: session.sessionId,
        challengeId: session.challengeId,
        dayIndex: session.dayIndex,
        workout: this.workout.id,
        plan: session.plan,
        targetRounds: session.targetRounds,
      }),
    );
    this.publishLive('running');
  }

  pause(): void {
    if (this.live.get().phase !== 'running') {
      return;
    }
    const now = this.deps.clock();
    this.clock.pause(now);
    this.deps.bus.publish(
      sessionPaused.create(this.deps, {
        sessionId: this.requireSession().sessionId,
        tMs: this.tMs(now),
      }),
    );
    this.publishLive('paused');
  }

  resume(): void {
    if (this.live.get().phase !== 'paused') {
      return;
    }
    const now = this.deps.clock();
    this.clock.resume(now);
    this.currentDetector().reset();
    this.deps.bus.publish(
      sessionResumed.create(this.deps, {
        sessionId: this.requireSession().sessionId,
        tMs: this.tMs(now),
      }),
    );
    this.publishLive('running');
  }

  /** Called by the shell on an interval; also drives the timeout. */
  tick(): void {
    const phase = this.live.get().phase;
    if (phase !== 'running' && phase !== 'paused') {
      return;
    }
    const now = this.deps.clock();
    if (phase === 'running' && this.clock.isOver(now)) {
      this.finish(false);
      return;
    }
    this.publishLive(phase);
  }

  onFrame(frame: PoseFrame): void {
    this.pose.set(frame);
    const state = this.live.get();
    if (state.phase === 'idle' || state.phase === 'finished') {
      return;
    }
    const framing = this.gate.step(frame).state;

    if (state.phase === 'framing' || state.phase === 'ready') {
      this.publishLive(framing === 'ok' ? 'ready' : 'framing', framing);
      return;
    }
    if (state.phase === 'paused') {
      this.publishLive('paused', framing);
      return;
    }

    // running
    if (this.lastFrameMs !== undefined && framing !== 'ok') {
      this.framingLostMs += Math.max(0, frame.tMs - this.lastFrameMs);
    }
    this.lastFrameMs = frame.tMs;
    if (framing !== 'ok') {
      this.publishLive('running', framing);
      return;
    }

    const detector = this.currentDetector();
    const session = this.requireSession();
    const now = this.deps.clock();
    if (this.guardUntilMs !== undefined) {
      if (now < this.guardUntilMs) {
        this.publishLive('running', framing, { detectorPhase: 'transition' });
        return;
      }
      this.guardUntilMs = undefined;
      detector.reset();
    }
    const output = detector.step(frame);
    if (output.repCompleted) {
      this.repsCounted += 1;
      this.repsInSet += 1;
      this.lastCountedFrame = { move: detector.move, frame };
      this.deps.bus.publish(
        repCounted.create(this.deps, {
          sessionId: session.sessionId,
          move: detector.move,
          variant: detector.variant,
          detectorId: detector.id,
          round: this.round,
          indexInSet: this.repsInSet,
          tMs: this.tMs(now),
        }),
      );
      this.advanceIfSetDone(now);
      this.publishLive('running', framing, {
        lastCountAtMs: now,
        detectorPhase: output.phase,
        signal: output.signal,
      });
      return;
    }
    if (output.rejected) {
      this.repsRejected += 1;
      this.deps.bus.publish(
        repRejected.create(this.deps, {
          sessionId: session.sessionId,
          move: detector.move,
          variant: detector.variant,
          detectorId: detector.id,
          reason: output.rejected.reason,
          tMs: this.tMs(now),
        }),
      );
      this.publishLive('running', framing, {
        lastReject: { reason: output.rejected.reason, atMs: now },
        detectorPhase: output.phase,
        signal: output.signal,
      });
      return;
    }
    this.publishLive('running', framing, { detectorPhase: output.phase, signal: output.signal });
  }

  /** "+1 · it was clean": the athlete overrides an undercount. Recorded as manual. */
  addManualRep(): void {
    const phase = this.live.get().phase;
    if (phase !== 'running' && phase !== 'paused') {
      return;
    }
    const now = this.deps.clock();
    this.repsManual += 1;
    this.repsInSet += 1;
    this.deps.bus.publish(
      repAddedManually.create(this.deps, {
        sessionId: this.requireSession().sessionId,
        move: this.currentDetector().move,
        round: this.round,
        indexInSet: this.repsInSet,
        tMs: this.tMs(now),
      }),
    );
    this.advanceIfSetDone(now);
    this.publishLive(phase);
  }

  finish(early: boolean): void {
    const phase = this.live.get().phase;
    if (phase !== 'running' && phase !== 'paused') {
      return;
    }
    const session = this.requireSession();
    const now = this.deps.clock();
    const score = scoreFrom(this.workout, this.round, this.setIndex, this.repsInSet);
    if (this.lastCountedFrame) {
      this.deps.bus.publish(
        sessionPoseCaptured.create(this.deps, {
          sessionId: session.sessionId,
          move: this.lastCountedFrame.move,
          joints: compactJoints(this.lastCountedFrame.frame),
        }),
      );
    }
    this.deps.bus.publish(
      sessionFinished.create(this.deps, {
        sessionId: session.sessionId,
        rounds: score.rounds,
        leftoverReps: score.leftoverReps,
        repsCounted: this.repsCounted,
        repsManual: this.repsManual,
        repsRejected: this.repsRejected,
        early,
        durationMs: Math.round(this.clock.elapsed(now)),
        framingLostMs: Math.round(this.framingLostMs),
      }),
    );
    this.publishLive('finished');
  }

  abandon(): void {
    const phase = this.live.get().phase;
    if (phase === 'running' || phase === 'paused') {
      const now = this.deps.clock();
      this.deps.bus.publish(
        sessionAbandoned.create(this.deps, {
          sessionId: this.requireSession().sessionId,
          tMs: this.tMs(now),
        }),
      );
    }
    this.session = undefined;
    this.publishLive('idle', 'no-body');
  }

  private advanceIfSetDone(now: number): void {
    const session = this.requireSession();
    const set = this.workout.sets[this.setIndex];
    if (!set || this.repsInSet < set.reps) {
      return;
    }
    this.deps.bus.publish(
      setCompleted.create(this.deps, {
        sessionId: session.sessionId,
        move: set.move,
        round: this.round,
        tMs: this.tMs(now),
      }),
    );
    this.setIndex += 1;
    this.repsInSet = 0;
    if (this.setIndex >= this.workout.sets.length) {
      this.deps.bus.publish(
        roundCompleted.create(this.deps, {
          sessionId: session.sessionId,
          round: this.round,
          tMs: this.tMs(now),
        }),
      );
      this.round += 1;
      this.setIndex = 0;
    }
    const detector = this.currentDetector();
    detector.reset();
    this.gate = new FramingGate(detector.requires);
    this.guardUntilMs = now + TRANSITION_GUARD_MS;
  }

  private currentDetector(): Detector {
    const detector = this.detectors[this.setIndex];
    if (!detector) {
      throw new Error('director: no detector for current set');
    }
    return detector;
  }

  private requireSession(): SessionStart {
    if (!this.session) {
      throw new Error('director: no session prepared');
    }
    return this.session;
  }

  private tMs(now: number): number {
    return Math.max(0, Math.round(now - (this.startedAtMs ?? now)));
  }

  private publishLive(
    phase: DirectorPhase,
    framing: FramingState = this.live.get().framing,
    extra: Partial<
      Pick<LiveState, 'lastReject' | 'lastCountAtMs' | 'detectorPhase' | 'signal'>
    > = {},
  ): void {
    this.live.set(this.snapshot(phase, framing, extra));
  }

  private snapshot(
    phase: DirectorPhase,
    framing: FramingState,
    extra: Partial<
      Pick<LiveState, 'lastReject' | 'lastCountAtMs' | 'detectorPhase' | 'signal'>
    > = {},
  ): LiveState {
    const previous = this.live?.get();
    const set = this.workout.sets[this.setIndex] ?? this.workout.sets[0];
    const detector = this.detectors[this.setIndex];
    const score = scoreFrom(this.workout, this.round, this.setIndex, this.repsInSet);
    const now = this.deps.clock();
    return {
      phase,
      sessionId: this.session?.sessionId,
      round: this.round,
      setIndex: this.setIndex,
      move: set?.move ?? 'pullup',
      variant: detector?.variant ?? 'rx',
      repsInSet: this.repsInSet,
      repsTarget: set?.reps ?? 0,
      rounds: score.rounds,
      leftoverReps: score.leftoverReps,
      framing,
      remainingMs:
        phase === 'idle' || phase === 'framing' || phase === 'ready'
          ? this.workout.durationMs
          : this.clock.remaining(now),
      lastReject: extra.lastReject ?? previous?.lastReject,
      lastCountAtMs: extra.lastCountAtMs ?? previous?.lastCountAtMs,
      detectorPhase: extra.detectorPhase ?? previous?.detectorPhase ?? 'unknown',
      signal: extra.signal ?? previous?.signal,
    };
  }
}

function compactJoints(frame: PoseFrame): Array<[string, number, number]> {
  const out: Array<[string, number, number]> = [];
  for (const name of CARD_JOINTS) {
    const p = joint(frame, name);
    if (p) {
      out.push([name, Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000]);
    }
  }
  return out;
}
