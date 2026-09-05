import type { EventSubscription } from 'expo-modules-core';
import {
  AppleVisionPose,
  type CameraFacing,
  type NativePosePayload,
} from '../../modules/apple-vision-pose';
import type { Joint, JointPoint, PoseFrame } from '../domain/pose/pose-frame';
import type { PoseSource, Unsubscribe } from '../domain/pose/pose-source';

/** The camera. Only adapter that knows Apple Vision exists. */
export class LivePoseSource implements PoseSource {
  readonly kind = 'live' as const;
  private readonly listeners = new Set<(frame: PoseFrame) => void>();
  private subscription: EventSubscription | undefined;
  private errorSubscription: EventSubscription | undefined;

  constructor(
    private readonly facing: () => CameraFacing,
    private readonly onError: (message: string) => void,
  ) {}

  static available(): boolean {
    return AppleVisionPose !== null && AppleVisionPose.isAvailable();
  }

  async start(): Promise<void> {
    if (!AppleVisionPose) {
      throw new Error('AppleVisionPose module is not linked in this build');
    }
    this.subscription?.remove();
    this.subscription = AppleVisionPose.addListener('onPose', (payload) => {
      const frame = toFrame(payload);
      for (const listener of this.listeners) {
        listener(frame);
      }
    });
    this.errorSubscription?.remove();
    this.errorSubscription = AppleVisionPose.addListener('onError', ({ message }) =>
      this.onError(message),
    );
    await AppleVisionPose.start({ facing: this.facing(), fps: 30 });
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = undefined;
    this.errorSubscription?.remove();
    this.errorSubscription = undefined;
    void AppleVisionPose?.stop();
  }

  subscribe(listener: (frame: PoseFrame) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function toFrame(payload: NativePosePayload): PoseFrame {
  const joints: Partial<Record<Joint, JointPoint>> = {};
  for (const [name, [x, y, c]] of Object.entries(payload.joints)) {
    joints[name as Joint] = { x, y, c };
  }
  return { tMs: payload.tMs, joints, width: payload.width, height: payload.height };
}
