import type { Move } from '../detectors/detector.js';
import type { Joint, JointPoint, PoseFrame } from './pose-frame.js';

/**
 * Synthetic poses for each movement: a full body that cycles between a start pose
 * (hang / lockout / standing) and an end pose (top / bottom) at a fixed cadence.
 * Good enough to drive detectors and the HUD; not a substitute for footage.
 */
export function simFrame(
  move: Move,
  tMs: number,
  periodMs = 2000,
  width = 1080,
  height = 1920,
): PoseFrame {
  const phase = (tMs % periodMs) / periodMs;
  const depth = (1 - Math.cos(phase * 2 * Math.PI)) / 2; // 0 at start, 1 at the far end
  return { tMs, joints: interpolate(POSES[move].start, POSES[move].end, depth), width, height };
}

/** A pose at a fixed depth (0 = start, 1 = end); handy for tests. */
export function simPoseAt(move: Move, depth: number, tMs = 0): PoseFrame {
  return {
    tMs,
    joints: interpolate(POSES[move].start, POSES[move].end, depth),
    width: 1080,
    height: 1920,
  };
}

type Pose = Partial<Record<Joint, readonly [number, number]>>;

function interpolate(a: Pose, b: Pose, t: number): PoseFrame['joints'] {
  const out: Partial<Record<Joint, JointPoint>> = {};
  for (const name of Object.keys(a) as Joint[]) {
    const pa = a[name];
    const pb = b[name] ?? pa;
    if (!pa || !pb) {
      continue;
    }
    out[name] = { x: pa[0] + (pb[0] - pa[0]) * t, y: pa[1] + (pb[1] - pa[1]) * t, c: 0.9 };
  }
  return out;
}

// Elbow angles: pullup hang ≈ 173°, top ≈ 26°; pushup lockout ≈ 170°, bottom ≈ 43°.
// Knee angle: standing ≈ 177°, squat bottom well under 100° with hips below knees.
const POSES: Record<Move, { start: Pose; end: Pose }> = {
  pullup: {
    start: {
      nose: [0.5, 0.38],
      neck: [0.5, 0.45],
      leftShoulder: [0.4, 0.5],
      rightShoulder: [0.6, 0.5],
      leftElbow: [0.372, 0.36],
      rightElbow: [0.628, 0.36],
      leftWrist: [0.36, 0.2],
      rightWrist: [0.64, 0.2],
      leftHip: [0.44, 0.75],
      rightHip: [0.56, 0.75],
      leftKnee: [0.44, 0.95],
      rightKnee: [0.56, 0.95],
    },
    end: {
      nose: [0.5, 0.16],
      neck: [0.5, 0.23],
      leftShoulder: [0.4, 0.28],
      rightShoulder: [0.6, 0.28],
      leftElbow: [0.3, 0.38],
      rightElbow: [0.7, 0.38],
      leftWrist: [0.36, 0.2],
      rightWrist: [0.64, 0.2],
      leftHip: [0.44, 0.53],
      rightHip: [0.56, 0.53],
      leftKnee: [0.44, 0.73],
      rightKnee: [0.56, 0.73],
    },
  },
  pushup: {
    start: {
      nose: [0.33, 0.53],
      neck: [0.38, 0.55],
      leftShoulder: [0.4, 0.55],
      rightShoulder: [0.41, 0.56],
      leftElbow: [0.42, 0.675],
      rightElbow: [0.43, 0.685],
      leftWrist: [0.42, 0.8],
      rightWrist: [0.43, 0.81],
      leftHip: [0.62, 0.6],
      rightHip: [0.63, 0.61],
      leftKnee: [0.78, 0.7],
      rightKnee: [0.79, 0.71],
      leftAnkle: [0.92, 0.8],
      rightAnkle: [0.93, 0.81],
    },
    end: {
      nose: [0.33, 0.71],
      neck: [0.38, 0.73],
      leftShoulder: [0.4, 0.73],
      rightShoulder: [0.41, 0.74],
      leftElbow: [0.32, 0.78],
      rightElbow: [0.33, 0.79],
      leftWrist: [0.42, 0.8],
      rightWrist: [0.43, 0.81],
      leftHip: [0.62, 0.7],
      rightHip: [0.63, 0.71],
      leftKnee: [0.78, 0.75],
      rightKnee: [0.79, 0.76],
      leftAnkle: [0.92, 0.8],
      rightAnkle: [0.93, 0.81],
    },
  },
  squat: {
    start: {
      nose: [0.5, 0.12],
      neck: [0.5, 0.18],
      leftShoulder: [0.42, 0.22],
      rightShoulder: [0.58, 0.22],
      leftElbow: [0.36, 0.34],
      rightElbow: [0.64, 0.34],
      leftWrist: [0.34, 0.44],
      rightWrist: [0.66, 0.44],
      leftHip: [0.45, 0.5],
      rightHip: [0.55, 0.5],
      leftKnee: [0.44, 0.7],
      rightKnee: [0.56, 0.7],
      leftAnkle: [0.44, 0.9],
      rightAnkle: [0.56, 0.9],
    },
    end: {
      nose: [0.5, 0.4],
      neck: [0.5, 0.46],
      leftShoulder: [0.42, 0.5],
      rightShoulder: [0.58, 0.5],
      leftElbow: [0.36, 0.6],
      rightElbow: [0.64, 0.6],
      leftWrist: [0.34, 0.68],
      rightWrist: [0.66, 0.68],
      leftHip: [0.46, 0.75],
      rightHip: [0.54, 0.75],
      leftKnee: [0.5, 0.72],
      rightKnee: [0.6, 0.72],
      leftAnkle: [0.44, 0.9],
      rightAnkle: [0.56, 0.9],
    },
  },
  // Side-on inverted row: long axis is horizontal, wrists stay above the shoulders.
  row: {
    start: {
      nose: [0.38, 0.52],
      neck: [0.4, 0.54],
      leftShoulder: [0.42, 0.55],
      rightShoulder: [0.44, 0.56],
      leftElbow: [0.44, 0.42],
      rightElbow: [0.46, 0.43],
      leftWrist: [0.44, 0.3],
      rightWrist: [0.46, 0.31],
      leftHip: [0.64, 0.58],
      rightHip: [0.66, 0.59],
      leftKnee: [0.78, 0.7],
      rightKnee: [0.8, 0.71],
      leftAnkle: [0.9, 0.82],
      rightAnkle: [0.92, 0.83],
    },
    end: {
      nose: [0.38, 0.36],
      neck: [0.4, 0.38],
      leftShoulder: [0.42, 0.38],
      rightShoulder: [0.44, 0.39],
      leftElbow: [0.34, 0.42],
      rightElbow: [0.36, 0.43],
      leftWrist: [0.44, 0.3],
      rightWrist: [0.46, 0.31],
      leftHip: [0.64, 0.46],
      rightHip: [0.66, 0.47],
      leftKnee: [0.78, 0.64],
      rightKnee: [0.8, 0.65],
      leftAnkle: [0.9, 0.82],
      rightAnkle: [0.92, 0.83],
    },
  },
};
