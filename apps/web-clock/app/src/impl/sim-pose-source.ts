import type { Move } from '../domain/detectors/detector';
import type { PoseFrame } from '../domain/pose/pose-frame';
import type { PoseSource, Unsubscribe } from '../domain/pose/pose-source';
import { simFrame } from '../domain/pose/sim-pose';

/**
 * A tireless synthetic athlete: performs whatever movement the director currently
 * wants at a steady cadence. Development default when the camera module is absent
 * (Expo Go, simulator) and the debug option in settings.
 */
export class SimPoseSource implements PoseSource {
  readonly kind = 'sim' as const;
  private readonly listeners = new Set<(frame: PoseFrame) => void>();
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly currentMove: () => Move,
    private readonly periodMs = 2000,
    private readonly fps = 30,
  ) {}

  async start(): Promise<void> {
    this.stop();
    const started = Date.now();
    this.timer = setInterval(() => {
      const frame = simFrame(this.currentMove(), Date.now() - started, this.periodMs);
      for (const listener of this.listeners) {
        listener(frame);
      }
    }, 1000 / this.fps);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  subscribe(listener: (frame: PoseFrame) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
