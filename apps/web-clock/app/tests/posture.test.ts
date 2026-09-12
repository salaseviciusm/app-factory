import { describe, expect, it } from 'vitest';
import { PullupDetector } from '../src/domain/detectors/pullup-detector.js';
import { PushupDetector } from '../src/domain/detectors/pushup-detector.js';
import { RowDetector } from '../src/domain/detectors/row-detector.js';
import { SquatDetector } from '../src/domain/detectors/squat-detector.js';
import { classifyPosture, PostureArm } from '../src/domain/pose/posture.js';
import { CAMERAS, projectedFrames } from '../src/domain/pose/project.js';
import { simPoseAt } from '../src/domain/pose/sim-pose.js';
import { run, simFrames } from './helpers.js';

describe('posture on the 2D sim athlete', () => {
  it('labels each movement the way the gate expects, at start and end', () => {
    expect(classifyPosture(simPoseAt('pullup', 0)).posture).toBe('hang');
    expect(classifyPosture(simPoseAt('pullup', 1)).posture).toBe('hang');
    expect(classifyPosture(simPoseAt('pushup', 0)).posture).toBe('plank');
    expect(classifyPosture(simPoseAt('pushup', 1)).posture).toBe('plank');
    expect(classifyPosture(simPoseAt('squat', 0)).posture).toBe('stand');
    expect(classifyPosture(simPoseAt('squat', 1)).posture).toBe('stand');
    expect(classifyPosture(simPoseAt('row', 0)).posture).toBe('supine');
    expect(classifyPosture(simPoseAt('row', 1)).posture).toBe('supine');
  });
});

describe('PostureArm hold', () => {
  it('keeps a mid-cycle row armed through plank, but will not start on plank', () => {
    const arm = new PostureArm('supine', 10, ['plank']);
    const idle = { reset(): void {}, currentPhase: 'start' };
    expect(arm.allow('plank', idle)).toBe(false);
    const mid = { reset(): void {}, currentPhase: 'end' };
    expect(arm.allow('plank', mid)).toBe(true);
    expect(arm.allow('supine', mid)).toBe(true);
  });
});

describe('posture gate stops cross-talk', () => {
  it('does not count simulated rows as push-ups or pull-ups', () => {
    const rows = simFrames('row', 8);
    expect(run(new RowDetector(), rows).counted).toBe(8);
    expect(run(new PushupDetector('rx'), rows).counted).toBe(0);
    expect(run(new PullupDetector('rx'), rows).counted).toBe(0);
    expect(run(new SquatDetector('rx'), rows).counted).toBe(0);
  });

  it('does not count simulated pull-ups as push-ups', () => {
    const pulls = simFrames('pullup', 5);
    expect(run(new PullupDetector('rx'), pulls).counted).toBe(5);
    expect(run(new PushupDetector('rx'), pulls).counted).toBe(0);
    expect(run(new RowDetector(), pulls).counted).toBe(0);
  });

  it('does not count simulated push-ups as pull-ups or rows', () => {
    const pushes = simFrames('pushup', 8);
    expect(run(new PushupDetector('rx'), pushes).counted).toBe(8);
    expect(run(new PullupDetector('rx'), pushes).counted).toBe(0);
    expect(run(new RowDetector(), pushes).counted).toBe(0);
  });
});

/**
 * Filming a plank from the head (`rear-hip`): the torso stacks into a stand and
 * the 2D elbows do not cycle. A framing fail in real use — do not retune to pass it.
 */
const FRAMING_FAIL = new Set(['rear-hip:pushup']);

describe('multi-view 3D projections', () => {
  it('classifies a spine-on row as supine, not a hang', () => {
    const floor = CAMERAS.find((c) => c.id === 'front-floor');
    const rear = CAMERAS.find((c) => c.id === 'rear-hip');
    expect(floor && classifyPosture(projectedFrames('row', floor, 1)[0]!).posture).toBe('supine');
    expect(rear && classifyPosture(projectedFrames('row', rear, 1)[0]!).posture).toBe('supine');
  });

  it('counts the same movement from every usable camera and does not cross-count', () => {
    for (const camera of CAMERAS) {
      const pulls = projectedFrames('pullup', camera, 4);
      const rows = projectedFrames('row', camera, 4);
      const pushes = projectedFrames('pushup', camera, 4);
      const squats = projectedFrames('squat', camera, 4);
      expect(run(new PullupDetector('rx'), pulls).counted, `${camera.id} pull`).toBe(4);
      expect(run(new PushupDetector('rx'), pulls).counted, `${camera.id} push-on-pull`).toBe(0);
      expect(run(new RowDetector(), rows).counted, `${camera.id} row`).toBe(4);
      expect(run(new PushupDetector('rx'), rows).counted, `${camera.id} push-on-row`).toBe(0);
      expect(run(new PullupDetector('rx'), rows).counted, `${camera.id} pull-on-row`).toBe(0);
      if (!FRAMING_FAIL.has(`${camera.id}:pushup`)) {
        expect(run(new PushupDetector('rx'), pushes).counted, `${camera.id} push`).toBe(4);
      }
      expect(run(new RowDetector(), pushes).counted, `${camera.id} row-on-push`).toBe(0);
      expect(run(new PullupDetector('rx'), pushes).counted, `${camera.id} pull-on-push`).toBe(0);
      expect(run(new SquatDetector('rx'), squats).counted, `${camera.id} squat`).toBe(4);
      expect(run(new PushupDetector('rx'), squats).counted, `${camera.id} push-on-squat`).toBe(0);
    }
  });
});
