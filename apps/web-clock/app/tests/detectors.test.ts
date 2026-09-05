import { describe, expect, it } from 'vitest';
import { PullupDetector } from '../src/domain/detectors/pullup-detector.js';
import { PushupDetector } from '../src/domain/detectors/pushup-detector.js';
import { SquatDetector } from '../src/domain/detectors/squat-detector.js';
import { FramingGate } from '../src/domain/detectors/framing-gate.js';
import { simPoseAt } from '../src/domain/pose/sim-pose.js';
import type { PoseFrame } from '../src/domain/pose/pose-frame.js';
import { loadFixture, run, simFrames } from './helpers.js';

describe('pull-up detector', () => {
  it('counts every simulated rx rep once', () => {
    const result = run(new PullupDetector('rx'), simFrames('pullup', 5));
    expect(result.counted).toBe(5);
    expect(result.rejects).toEqual([]);
  });

  it('counts the two complete reps in clip A (real footage; the clip opens mid-rep)', () => {
    // Spike 001 segmented 3 tops, but the first has no hang before it: the detector
    // only counts reps it saw start. Undercounting a rep it did not see is the rule.
    const result = run(new PullupDetector('rx'), loadFixture('pullup/clip-a'));
    expect(result.counted).toBe(2);
    expect(result.rejects).toEqual([]);
  });

  it('counts the three reps in clip B (real footage, angled)', () => {
    const result = run(new PullupDetector('rx'), loadFixture('pullup/clip-b'));
    expect(result.counted).toBe(3);
    expect(result.rejects).toEqual([]);
  });

  it('rejects a half pull as hang-short rather than counting it', () => {
    const frames: PoseFrame[] = [];
    let t = 0;
    const push = (depth: number) => {
      frames.push(simPoseAt('pullup', depth, t));
      t += 33;
    };
    for (let i = 0; i < 10; i += 1) push(0); // hang
    for (let d = 0; d <= 0.45; d += 0.05) push(d); // partway up
    for (let d = 0.45; d >= 0; d -= 0.05) push(d); // back down
    for (let i = 0; i < 10; i += 1) push(0);
    const result = run(new PullupDetector('rx'), frames);
    expect(result.counted).toBe(0);
    expect(result.rejects).toContain('hang-short');
  });

  it('rejects a chinless top on rx but not on jumping', () => {
    const frames: PoseFrame[] = [];
    let t = 0;
    const push = (depth: number) => {
      const f = simPoseAt('pullup', depth, t);
      // Drag the nose below the bar at every depth: elbows flex, chin never clears.
      const wristY = f.joints.leftWrist?.y ?? 0.2;
      frames.push({ ...f, joints: { ...f.joints, nose: { x: 0.5, y: wristY + 0.08, c: 0.9 } } });
      t += 33;
    };
    for (let d = 0; d <= 1; d += 0.05) push(d);
    for (let d = 1; d >= 0; d -= 0.05) push(d);
    for (let i = 0; i < 5; i += 1) push(0);
    expect(run(new PullupDetector('rx'), frames).rejects).toContain('chin-below-bar');
    expect(run(new PullupDetector('jumping'), frames).counted).toBe(1);
  });

  it('holds its phase and reports zero confidence when the arms are not visible', () => {
    const detector = new PullupDetector('rx');
    detector.reset();
    detector.step(simPoseAt('pullup', 0, 0));
    const out = detector.step({
      tMs: 33,
      width: 1080,
      height: 1920,
      joints: { nose: { x: 0.5, y: 0.5, c: 0.9 } },
    });
    expect(out.confidence).toBe(0);
    expect(out.repCompleted).toBe(false);
    expect(out.phase).toBe('start');
  });
});

describe('push-up detector', () => {
  it('counts simulated rx reps on return to lockout', () => {
    const result = run(new PushupDetector('rx'), simFrames('pushup', 10));
    expect(result.counted).toBe(10);
    expect(result.rejects).toEqual([]);
  });

  it('rejects a shallow dip as depth-short', () => {
    const frames: PoseFrame[] = [];
    let t = 0;
    const push = (depth: number) => {
      frames.push(simPoseAt('pushup', depth, t));
      t += 33;
    };
    for (let i = 0; i < 10; i += 1) push(0);
    for (let d = 0; d <= 0.55; d += 0.05) push(d); // elbows to ~117°, short of 95°
    for (let d = 0.55; d >= 0; d -= 0.05) push(d);
    for (let i = 0; i < 10; i += 1) push(0);
    const result = run(new PushupDetector('rx'), frames);
    expect(result.counted).toBe(0);
    expect(result.rejects).toEqual(['depth-short']);
  });

  it('knee variant accepts the same movement', () => {
    expect(run(new PushupDetector('knee'), simFrames('pushup', 10)).counted).toBe(10);
  });
});

describe('squat detector', () => {
  it('counts simulated rx reps on standing up', () => {
    const result = run(new SquatDetector('rx'), simFrames('squat', 15));
    expect(result.counted).toBe(15);
    expect(result.rejects).toEqual([]);
  });

  function partialSquat(maxDepth: number, liftHips = 0): PoseFrame[] {
    const frames: PoseFrame[] = [];
    let t = 0;
    const push = (depth: number) => {
      const f = simPoseAt('squat', depth, t);
      const joints = { ...f.joints };
      if (liftHips > 0) {
        for (const side of ['leftHip', 'rightHip'] as const) {
          const hip = joints[side];
          if (hip) {
            joints[side] = { ...hip, y: hip.y - liftHips * depth };
          }
        }
      }
      frames.push({ ...f, joints });
      t += 33;
    };
    for (let i = 0; i < 10; i += 1) push(0);
    for (let d = 0; d <= maxDepth; d += 0.05) push(d);
    for (let d = maxDepth; d >= 0; d -= 0.05) push(d);
    for (let i = 0; i < 10; i += 1) push(0);
    return frames;
  }

  it('rx rejects a squat whose knees never bend past parallel', () => {
    const rx = run(new SquatDetector('rx'), partialSquat(0.8)); // knee ≈ 103°, short of 100°
    expect(rx.counted).toBe(0);
    expect(rx.rejects).toEqual(['depth-short']);
  });

  it('rx rejects a deep knee bend whose hips stay above the knees', () => {
    const rx = run(new SquatDetector('rx'), partialSquat(1, 0.12));
    expect(rx.counted).toBe(0);
    expect(rx.rejects).toContain('depth-short');
  });

  it('box variant accepts the shallower squat rx rejects', () => {
    expect(run(new SquatDetector('box'), partialSquat(0.8)).counted).toBe(1);
  });
});

describe('framing gate', () => {
  const required = new PullupDetector('rx').requires;

  it('turns ok after a run of good frames and stays ok through one dropped frame', () => {
    const gate = new FramingGate(required);
    let state = gate.step(simPoseAt('pullup', 0, 0)).state;
    for (let i = 0; i < 12; i += 1) {
      state = gate.step(simPoseAt('pullup', 0, i * 33)).state;
    }
    expect(state).toBe('ok');
    state = gate.step({ tMs: 999, width: 1, height: 1, joints: {} }).state;
    expect(state).toBe('ok');
  });

  it('reports no-body when nothing is in frame for the window', () => {
    const gate = new FramingGate(required);
    let state = gate.step(simPoseAt('pullup', 0, 0)).state;
    for (let i = 0; i < 15; i += 1) {
      state = gate.step({ tMs: i, width: 1, height: 1, joints: {} }).state;
    }
    expect(state).toBe('no-body');
  });

  it('reports joints-missing when only half the arm chain is visible', () => {
    const gate = new FramingGate(required);
    let state: string = 'ok';
    for (let i = 0; i < 15; i += 1) {
      const f = simPoseAt('pullup', 0, i);
      state = gate.step({
        ...f,
        joints: { leftShoulder: f.joints.leftShoulder, leftElbow: f.joints.leftElbow },
      }).state;
    }
    expect(state).toBe('joints-missing');
  });
});
