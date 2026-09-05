/**
 * Vendor-free pose types. The native module (Apple Vision today) and every other
 * PoseSource adapter map into this shape; nothing downstream knows about Vision.
 *
 * Coordinates are normalized to the frame, origin top-left, y down — the convention
 * every UI layer expects. Vision's bottom-left/y-up is flipped in the adapter.
 */

export const JOINTS = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'neck',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'root',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
] as const;

export type Joint = (typeof JOINTS)[number];

export interface JointPoint {
  readonly x: number;
  readonly y: number;
  /** Detector confidence 0..1. Points below MIN_CONFIDENCE are treated as absent. */
  readonly c: number;
}

export interface PoseFrame {
  readonly tMs: number;
  readonly joints: Partial<Record<Joint, JointPoint>>;
  /** Source frame aspect, needed to map normalized coordinates onto a view. */
  readonly width: number;
  readonly height: number;
}

/** Below this a joint is noise (pullup spike 001: 0.30 separated usable from junk). */
export const MIN_CONFIDENCE = 0.3;

export function joint(frame: PoseFrame, name: Joint, minConfidence = MIN_CONFIDENCE) {
  const point = frame.joints[name];
  return point && point.c >= minConfidence ? point : undefined;
}

/** Interior angle at `b` formed by a-b-c, in degrees. */
export function angleDeg(a: JointPoint, b: JointPoint, c: JointPoint): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) {
    return 180;
  }
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function midpoint(a: JointPoint, b: JointPoint): JointPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, c: Math.min(a.c, b.c) };
}

/** Mean of the values present; undefined when none are. */
export function meanDefined(values: ReadonlyArray<number | undefined>): number | undefined {
  let sum = 0;
  let n = 0;
  for (const v of values) {
    if (v !== undefined) {
      sum += v;
      n += 1;
    }
  }
  return n === 0 ? undefined : sum / n;
}

export interface BoundingBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export function boundingBox(frame: PoseFrame, names: readonly Joint[]): BoundingBox | undefined {
  let box: BoundingBox | undefined;
  for (const name of names) {
    const p = joint(frame, name);
    if (!p) {
      continue;
    }
    box = box
      ? {
          minX: Math.min(box.minX, p.x),
          minY: Math.min(box.minY, p.y),
          maxX: Math.max(box.maxX, p.x),
          maxY: Math.max(box.maxY, p.y),
        }
      : { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
  }
  return box;
}

/** Bones drawn by the HUD overlay and the share card. */
export const BONES: ReadonlyArray<readonly [Joint, Joint]> = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
  ['neck', 'nose'],
];
