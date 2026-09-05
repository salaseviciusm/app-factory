import { readFileSync } from 'node:fs';
import {
  InMemoryEventBus,
  InMemoryEventStore,
  persistPublishedEvents,
  type Clock,
  type NewId,
} from '@factory/core';
import type { Detector, DetectorOutput, RejectReason } from '../src/domain/detectors/detector.js';
import { fixtureFrames, type PoseFixture } from '../src/domain/pose/fixture.js';
import type { PoseFrame } from '../src/domain/pose/pose-frame.js';
import { simFrame } from '../src/domain/pose/sim-pose.js';
import type { Move } from '../src/domain/detectors/detector.js';
import type { WorkoutEvent } from '../src/domain/workout/events.js';

export function loadFixture(name: string): PoseFrame[] {
  const raw = readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
  return fixtureFrames(JSON.parse(raw) as PoseFixture);
}

export function simFrames(move: Move, reps: number, periodMs = 2000, fps = 30): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const total = reps * periodMs;
  for (let t = 0; t <= total; t += 1000 / fps) {
    frames.push(simFrame(move, Math.round(t), periodMs));
  }
  return frames;
}

export interface RunResult {
  counted: number;
  rejects: RejectReason[];
  outputs: DetectorOutput[];
}

export function run(detector: Detector, frames: readonly PoseFrame[]): RunResult {
  detector.reset();
  const result: RunResult = { counted: 0, rejects: [], outputs: [] };
  for (const frame of frames) {
    const out = detector.step(frame);
    result.outputs.push(out);
    if (out.repCompleted) {
      result.counted += 1;
    }
    if (out.rejected) {
      result.rejects.push(out.rejected.reason);
    }
  }
  return result;
}

/** Deterministic ids and a settable clock for driving the director. */
export function testDeps(): {
  bus: InMemoryEventBus<WorkoutEvent>;
  store: InMemoryEventStore<WorkoutEvent>;
  newId: NewId;
  clock: Clock;
  setNow(ms: number): void;
  advance(ms: number): void;
  events(): readonly WorkoutEvent[];
} {
  let now = 1_700_000_000_000;
  let n = 0;
  const bus = new InMemoryEventBus<WorkoutEvent>();
  const store = new InMemoryEventStore<WorkoutEvent>();
  persistPublishedEvents(bus, store);
  return {
    bus,
    store,
    newId: () => `id-${(n += 1)}`,
    clock: () => now,
    setNow: (ms) => {
      now = ms;
    },
    advance: (ms) => {
      now += ms;
    },
    events: () => store.read(),
  };
}
