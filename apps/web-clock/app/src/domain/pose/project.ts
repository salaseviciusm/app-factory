import type { Move } from '../detectors/detector.js';
import type { Joint, JointPoint, PoseFrame } from './pose-frame.js';

/**
 * A 3D stick figure (metres, y-up, athlete faces +z) projected through a pinhole
 * camera. This is how we test that a detector is not fitted to one patio angle:
 * the same movement, many cameras, same count.
 *
 * Pixel-generating AI video is the wrong tool for this. Vision run on invented
 * limbs produces goldens that describe the generator, not the athlete. Project
 * keypoints; keep the founder's real clips as the one-angle truth.
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type Skeleton3 = Partial<Record<Joint, Vec3>>;

export interface Camera {
  readonly id: string;
  readonly eye: Vec3;
  readonly look: Vec3;
  readonly up: Vec3;
  readonly fovDeg: number;
}

const UP: Vec3 = { x: 0, y: 1, z: 0 };

/** A grid of phones: hip-height and floor, front / side / ¾ / rear. */
export const CAMERAS: readonly Camera[] = [
  {
    id: 'front-hip',
    eye: { x: 0, y: 1.15, z: 3.4 },
    look: { x: 0, y: 1.05, z: 0 },
    up: UP,
    fovDeg: 50,
  },
  {
    id: 'front-floor',
    eye: { x: 0, y: 0.18, z: 2.9 },
    look: { x: 0, y: 1.0, z: 0 },
    up: UP,
    fovDeg: 55,
  },
  {
    id: 'side-hip',
    eye: { x: 3.3, y: 1.15, z: 0.35 },
    look: { x: 0, y: 1.0, z: 0.3 },
    up: UP,
    fovDeg: 50,
  },
  {
    id: 'side-floor',
    eye: { x: 2.6, y: 0.18, z: 0.25 },
    look: { x: 0, y: 0.85, z: 0.3 },
    up: UP,
    fovDeg: 55,
  },
  {
    id: 'rear-hip',
    eye: { x: 0, y: 1.15, z: -3.4 },
    look: { x: 0, y: 1.05, z: 0 },
    up: UP,
    fovDeg: 50,
  },
  {
    id: 'three-quarter',
    eye: { x: 2.2, y: 1.1, z: 2.3 },
    look: { x: 0, y: 1.0, z: 0.2 },
    up: UP,
    fovDeg: 50,
  },
];

export function project(
  skeleton: Skeleton3,
  camera: Camera,
  tMs: number,
  width = 1080,
  height = 1920,
): PoseFrame {
  const joints: Partial<Record<Joint, JointPoint>> = {};
  for (const [name, p] of Object.entries(skeleton) as [Joint, Vec3 | undefined][]) {
    if (!p) {
      continue;
    }
    const ndc = toNdc(p, camera, width / height);
    if (!ndc) {
      continue;
    }
    joints[name] = { x: ndc.x, y: ndc.y, c: 0.9 };
  }
  return { tMs, joints, width, height };
}

/** Depth 0 = start (hang / lockout / stand / long-arm row), 1 = far end. */
export function athleteAt(move: Move, depth: number): Skeleton3 {
  const t = clamp01(depth);
  const a = CANONICAL[move].start;
  const b = CANONICAL[move].end;
  const out: Skeleton3 = {};
  for (const name of Object.keys(a) as Joint[]) {
    const pa = a[name];
    const pb = b[name] ?? pa;
    if (!pa || !pb) {
      continue;
    }
    out[name] = {
      x: pa.x + (pb.x - pa.x) * t,
      y: pa.y + (pb.y - pa.y) * t,
      z: pa.z + (pb.z - pa.z) * t,
    };
  }
  return out;
}

export function projectedFrames(
  move: Move,
  camera: Camera,
  reps: number,
  periodMs = 2000,
  fps = 30,
): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const total = reps * periodMs;
  for (let t = 0; t <= total; t += 1000 / fps) {
    const phase = (t % periodMs) / periodMs;
    const depth = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
    frames.push(project(athleteAt(move, depth), camera, Math.round(t)));
  }
  return frames;
}

function toNdc(p: Vec3, camera: Camera, aspect: number): { x: number; y: number } | undefined {
  const f = norm(sub(camera.look, camera.eye));
  const r = norm(cross(f, camera.up));
  const u = cross(r, f);
  const rel = sub(p, camera.eye);
  const cam = { x: dot(rel, r), y: dot(rel, u), z: dot(rel, f) };
  if (cam.z < 0.2) {
    return undefined;
  }
  const vFov = ((camera.fovDeg / 2) * Math.PI) / 180;
  const hFov = Math.atan(Math.tan(vFov) * aspect);
  const x = 0.5 + cam.x / (2 * cam.z * Math.tan(hFov));
  const y = 0.5 - cam.y / (2 * cam.z * Math.tan(vFov));
  if (x < -0.05 || x > 1.05 || y < -0.05 || y > 1.05) {
    return undefined;
  }
  return { x: clamp01(x), y: clamp01(y) };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function norm(v: Vec3): Vec3 {
  const n = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}
function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

type Pose3 = Partial<Record<Joint, Vec3>>;

const CANONICAL: Record<Move, { start: Pose3; end: Pose3 }> = {
  pullup: {
    start: {
      nose: { x: 0, y: 1.72, z: 0.08 },
      neck: { x: 0, y: 1.58, z: 0 },
      leftShoulder: { x: -0.18, y: 1.5, z: 0 },
      rightShoulder: { x: 0.18, y: 1.5, z: 0 },
      leftElbow: { x: -0.2, y: 1.85, z: 0.02 },
      rightElbow: { x: 0.2, y: 1.85, z: 0.02 },
      leftWrist: { x: -0.2, y: 2.15, z: 0.02 },
      rightWrist: { x: 0.2, y: 2.15, z: 0.02 },
      leftHip: { x: -0.12, y: 0.95, z: 0 },
      rightHip: { x: 0.12, y: 0.95, z: 0 },
      leftKnee: { x: -0.12, y: 0.5, z: 0.04 },
      rightKnee: { x: 0.12, y: 0.5, z: 0.04 },
      leftAnkle: { x: -0.12, y: 0.08, z: 0.02 },
      rightAnkle: { x: 0.12, y: 0.08, z: 0.02 },
    },
    end: {
      nose: { x: 0, y: 2.12, z: 0.08 },
      neck: { x: 0, y: 1.98, z: 0 },
      leftShoulder: { x: -0.18, y: 1.92, z: 0 },
      rightShoulder: { x: 0.18, y: 1.92, z: 0 },
      leftElbow: { x: -0.32, y: 1.85, z: 0.05 },
      rightElbow: { x: 0.32, y: 1.85, z: 0.05 },
      leftWrist: { x: -0.2, y: 2.15, z: 0.02 },
      rightWrist: { x: 0.2, y: 2.15, z: 0.02 },
      leftHip: { x: -0.12, y: 1.38, z: 0 },
      rightHip: { x: 0.12, y: 1.38, z: 0 },
      leftKnee: { x: -0.12, y: 0.95, z: 0.08 },
      rightKnee: { x: 0.12, y: 0.95, z: 0.08 },
      leftAnkle: { x: -0.12, y: 0.55, z: 0.06 },
      rightAnkle: { x: 0.12, y: 0.55, z: 0.06 },
    },
  },
  pushup: {
    start: {
      nose: { x: 0, y: 0.28, z: 0.02 },
      neck: { x: 0, y: 0.3, z: 0.1 },
      leftShoulder: { x: -0.18, y: 0.32, z: 0.16 },
      rightShoulder: { x: 0.18, y: 0.32, z: 0.16 },
      leftElbow: { x: -0.2, y: 0.18, z: 0.16 },
      rightElbow: { x: 0.2, y: 0.18, z: 0.16 },
      leftWrist: { x: -0.2, y: 0.06, z: 0.16 },
      rightWrist: { x: 0.2, y: 0.06, z: 0.16 },
      leftHip: { x: -0.1, y: 0.32, z: 0.72 },
      rightHip: { x: 0.1, y: 0.32, z: 0.72 },
      leftKnee: { x: -0.1, y: 0.2, z: 1.0 },
      rightKnee: { x: 0.1, y: 0.2, z: 1.0 },
      leftAnkle: { x: -0.1, y: 0.08, z: 1.22 },
      rightAnkle: { x: 0.1, y: 0.08, z: 1.22 },
    },
    end: {
      nose: { x: 0, y: 0.12, z: 0.02 },
      neck: { x: 0, y: 0.14, z: 0.1 },
      leftShoulder: { x: -0.18, y: 0.14, z: 0.16 },
      rightShoulder: { x: 0.18, y: 0.14, z: 0.16 },
      leftElbow: { x: -0.32, y: 0.12, z: 0.38 },
      rightElbow: { x: 0.32, y: 0.12, z: 0.38 },
      leftWrist: { x: -0.2, y: 0.06, z: 0.16 },
      rightWrist: { x: 0.2, y: 0.06, z: 0.16 },
      leftHip: { x: -0.1, y: 0.18, z: 0.72 },
      rightHip: { x: 0.1, y: 0.18, z: 0.72 },
      leftKnee: { x: -0.1, y: 0.14, z: 1.0 },
      rightKnee: { x: 0.1, y: 0.14, z: 1.0 },
      leftAnkle: { x: -0.1, y: 0.08, z: 1.22 },
      rightAnkle: { x: 0.1, y: 0.08, z: 1.22 },
    },
  },
  squat: {
    start: {
      nose: { x: 0, y: 1.7, z: 0.08 },
      neck: { x: 0, y: 1.56, z: 0 },
      leftShoulder: { x: -0.18, y: 1.48, z: 0 },
      rightShoulder: { x: 0.18, y: 1.48, z: 0 },
      leftElbow: { x: -0.28, y: 1.22, z: 0.06 },
      rightElbow: { x: 0.28, y: 1.22, z: 0.06 },
      leftWrist: { x: -0.22, y: 1.05, z: 0.12 },
      rightWrist: { x: 0.22, y: 1.05, z: 0.12 },
      leftHip: { x: -0.12, y: 0.95, z: 0 },
      rightHip: { x: 0.12, y: 0.95, z: 0 },
      leftKnee: { x: -0.12, y: 0.5, z: 0.04 },
      rightKnee: { x: 0.12, y: 0.5, z: 0.04 },
      leftAnkle: { x: -0.12, y: 0.08, z: 0.02 },
      rightAnkle: { x: 0.12, y: 0.08, z: 0.02 },
    },
    end: {
      nose: { x: 0, y: 1.22, z: 0.16 },
      neck: { x: 0, y: 1.1, z: 0.1 },
      leftShoulder: { x: -0.18, y: 1.02, z: 0.08 },
      rightShoulder: { x: 0.18, y: 1.02, z: 0.08 },
      leftElbow: { x: -0.3, y: 0.85, z: 0.14 },
      rightElbow: { x: 0.3, y: 0.85, z: 0.14 },
      leftWrist: { x: -0.22, y: 0.78, z: 0.2 },
      rightWrist: { x: 0.22, y: 0.78, z: 0.2 },
      leftHip: { x: -0.16, y: 0.32, z: 0.18 },
      rightHip: { x: 0.16, y: 0.32, z: 0.18 },
      leftKnee: { x: -0.18, y: 0.4, z: 0.28 },
      rightKnee: { x: 0.18, y: 0.4, z: 0.28 },
      leftAnkle: { x: -0.12, y: 0.08, z: 0.02 },
      rightAnkle: { x: 0.12, y: 0.08, z: 0.02 },
    },
  },
  row: {
    start: {
      nose: { x: 0, y: 0.62, z: 0.12 },
      neck: { x: 0, y: 0.58, z: 0.18 },
      leftShoulder: { x: -0.18, y: 0.55, z: 0.22 },
      rightShoulder: { x: 0.18, y: 0.55, z: 0.22 },
      leftElbow: { x: -0.2, y: 0.8, z: 0.22 },
      rightElbow: { x: 0.2, y: 0.8, z: 0.22 },
      leftWrist: { x: -0.2, y: 1.05, z: 0.22 },
      rightWrist: { x: 0.2, y: 1.05, z: 0.22 },
      leftHip: { x: -0.1, y: 0.5, z: 0.72 },
      rightHip: { x: 0.1, y: 0.5, z: 0.72 },
      leftKnee: { x: -0.1, y: 0.28, z: 1.0 },
      rightKnee: { x: 0.1, y: 0.28, z: 1.0 },
      leftAnkle: { x: -0.1, y: 0.08, z: 1.18 },
      rightAnkle: { x: 0.1, y: 0.08, z: 1.18 },
    },
    end: {
      nose: { x: 0, y: 0.92, z: 0.12 },
      neck: { x: 0, y: 0.88, z: 0.18 },
      leftShoulder: { x: -0.18, y: 0.86, z: 0.22 },
      rightShoulder: { x: 0.18, y: 0.86, z: 0.22 },
      leftElbow: { x: -0.32, y: 0.88, z: 0.18 },
      rightElbow: { x: 0.32, y: 0.88, z: 0.18 },
      leftWrist: { x: -0.2, y: 1.05, z: 0.22 },
      rightWrist: { x: 0.2, y: 1.05, z: 0.22 },
      leftHip: { x: -0.1, y: 0.72, z: 0.72 },
      rightHip: { x: 0.1, y: 0.72, z: 0.72 },
      leftKnee: { x: -0.1, y: 0.38, z: 1.0 },
      rightKnee: { x: 0.1, y: 0.38, z: 1.0 },
      leftAnkle: { x: -0.1, y: 0.08, z: 1.18 },
      rightAnkle: { x: 0.1, y: 0.08, z: 1.18 },
    },
  },
};
