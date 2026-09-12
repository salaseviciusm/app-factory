import type { Move } from '../detectors/detector.js';
import { joint, midpoint, type Joint, type PoseFrame } from './pose-frame.js';

/**
 * View-robust body configuration. Built from *relative* geometry (angles, lengths in
 * torso-units) so a floor-level phone and a hip-height phone can agree. Absolute pixel
 * positions and "is the nose above the wrists" are not used — those flip under a rear
 * view or a worm's-eye.
 *
 *   hang    — upright torso, wrists well above the shoulders (on a bar)
 *   stand   — upright torso, wrists not overhead (squats, walking, rest)
 *   plank   — long-axis nearer horizontal, wrists at or below the shoulders (push-up)
 *   supine  — long-axis nearer horizontal, wrists above the shoulders (inverted row)
 *   unknown — not enough joints to say
 */
export type Posture = 'hang' | 'stand' | 'plank' | 'supine' | 'unknown';

export interface PostureFeatures {
  /** 0 = image-vertical, 90 = image-horizontal. Undefined when torso is missing. */
  readonly torsoTilt?: number;
  /** Wrist height above the shoulders, in torso lengths. + = wrists toward the top. */
  readonly wristAboveShoulder?: number;
  /**
   * Torso length as a fraction of the visible body box. A front-on inverted row
   * foreshortens the torso (the long axis is into the camera) so this drops;
   * a hang always keeps a long vertical torso.
   */
  readonly torsoFraction?: number;
  /**
   * Hips were seen but sit on the shoulders in the image — the long axis is into
   * the camera. Distinct from missing hips (clip B of the pull-up spike).
   */
  readonly torsoCollapsed?: boolean;
}

/** Which posture a detector is allowed to run in. */
export const EXPECTED_POSTURE: Record<Move, Posture> = {
  pullup: 'hang',
  pushup: 'plank',
  squat: 'stand',
  row: 'supine',
};

/** Below this tilt (deg) the torso is upright. */
const UPRIGHT_BELOW = 48;
/** Above this tilt (deg) the torso is a plank / row. Dead band in between → unknown. */
const HORIZONTAL_ABOVE = 55;
/** Upright + wrists this many torso-lengths above the shoulders → hang, else stand. */
const HANG_WRIST = 0.22;
/** Horizontal + wrists this many torso-lengths above the shoulders → supine, else plank. */
const SUPINE_WRIST = 0.18;
/** Upright but torso is this small a fraction of the body box → foreshortened row, not hang. */
const FORESHORTENED_TORSO = 0.22;

export function postureFeatures(frame: PoseFrame): PostureFeatures {
  const shoulder = mid(frame, 'leftShoulder', 'rightShoulder');
  const hip = mid(frame, 'leftHip', 'rightHip');
  const wrist = mid(frame, 'leftWrist', 'rightWrist');
  const box = bodyBox(frame);
  if (!shoulder) {
    return {};
  }
  const torsoLen =
    hip !== undefined ? Math.hypot(hip.x - shoulder.x, hip.y - shoulder.y) : undefined;
  const scale = torsoLen !== undefined && torsoLen >= 0.04 ? torsoLen : 0.25;
  const wristAboveShoulder = wrist === undefined ? undefined : (shoulder.y - wrist.y) / scale;
  if (hip === undefined || torsoLen === undefined || torsoLen < 0.04) {
    // Missing hips (clip B) vs stacked hips (looking along the spine). Do not
    // invent a torso fraction — that misfires as a foreshortened row on a hang.
    return {
      wristAboveShoulder,
      torsoCollapsed: hip !== undefined && torsoLen !== undefined && torsoLen < 0.04,
    };
  }
  const torsoTilt =
    (Math.atan2(Math.abs(hip.x - shoulder.x), Math.abs(hip.y - shoulder.y)) * 180) / Math.PI;
  const torsoFraction = box !== undefined && box > 0.08 ? torsoLen / box : undefined;
  return { torsoTilt, wristAboveShoulder, torsoFraction };
}

export function classifyPosture(frame: PoseFrame): {
  posture: Posture;
  features: PostureFeatures;
} {
  const features = postureFeatures(frame);
  const { torsoTilt, wristAboveShoulder } = features;
  if (wristAboveShoulder === undefined) {
    return { posture: 'unknown', features };
  }
  const foreshortened = (features.torsoFraction ?? 1) < FORESHORTENED_TORSO;
  if (torsoTilt === undefined) {
    if (features.torsoCollapsed) {
      if (wristAboveShoulder >= SUPINE_WRIST) {
        return { posture: 'supine', features };
      }
      if (wristAboveShoulder <= -0.12) {
        return { posture: 'plank', features };
      }
      return { posture: 'unknown', features };
    }
    // Hips missing — clip B. Wrists overhead is a hang, not a guessed row.
    if (wristAboveShoulder >= HANG_WRIST) {
      return { posture: 'hang', features };
    }
    if (wristAboveShoulder <= -0.12) {
      return { posture: 'plank', features };
    }
    return { posture: 'unknown', features };
  }
  if (torsoTilt < UPRIGHT_BELOW) {
    if (wristAboveShoulder >= HANG_WRIST) {
      return { posture: foreshortened ? 'supine' : 'hang', features };
    }
    if (wristAboveShoulder <= 0 && (features.torsoFraction ?? 1) < 0.28) {
      return { posture: 'plank', features };
    }
    return { posture: 'stand', features };
  }
  if (torsoTilt > HORIZONTAL_ABOVE) {
    return { posture: wristAboveShoulder >= SUPINE_WRIST ? 'supine' : 'plank', features };
  }
  return { posture: 'unknown', features };
}

/**
 * Holds the cycle machine still when the athlete is in the wrong configuration, and
 * resets it after a run of mismatches so a row set cannot leave a push-up detector
 * half-way through a cycle. Unknown (lost joints) pauses without resetting.
 *
 * A short flicker mid-rep is stepped: a squat bottom can look like a compact plank
 * for a few frames. A machine that has not left `start` never steps on a mismatch,
 * so a row set cannot *begin* a push-up cycle.
 *
 * `hold` is a sibling posture that is treated as a match once a cycle has started.
 * Row uses `plank`: at the top the shoulders rise to the bar, wrists are no longer
 * "above", and the classifier flips supine → plank. That is still the same set.
 * Idle + hold does not start a cycle, so a later push-up set is not counted as rows.
 */
export class PostureArm {
  private mismatches = 0;

  constructor(
    private readonly expected: Posture,
    private readonly resetAfter = 10,
    private readonly hold: readonly Posture[] = [],
  ) {}

  reset(): void {
    this.mismatches = 0;
  }

  /** True → step the cycle machine this frame. */
  allow(posture: Posture, machine: { reset(): void; readonly currentPhase: string }): boolean {
    const midCycle = machine.currentPhase !== 'start' && machine.currentPhase !== 'unknown';
    if (posture === this.expected || (midCycle && this.hold.includes(posture))) {
      this.mismatches = 0;
      return true;
    }
    if (posture === 'unknown') {
      return false;
    }
    this.mismatches += 1;
    if (this.mismatches >= this.resetAfter) {
      machine.reset();
      this.mismatches = 0;
      return false;
    }
    return midCycle;
  }
}

function bodyBox(frame: PoseFrame): number | undefined {
  const names: Joint[] = [
    'leftShoulder',
    'rightShoulder',
    'leftHip',
    'rightHip',
    'leftAnkle',
    'rightAnkle',
    'leftWrist',
    'rightWrist',
    'nose',
  ];
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const name of names) {
    const p = joint(frame, name);
    if (!p) {
      continue;
    }
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return Number.isFinite(minY) ? maxY - minY : undefined;
}

function mid(frame: PoseFrame, a: Joint, b: Joint) {
  const pa = joint(frame, a);
  const pb = joint(frame, b);
  if (pa && pb) {
    return midpoint(pa, pb);
  }
  return pa ?? pb;
}
