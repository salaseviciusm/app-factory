import { fixtureFrames, type PoseFixture } from '../domain/pose/fixture';
import type { PoseFrame } from '../domain/pose/pose-frame';
import type { PoseSource, Unsubscribe } from '../domain/pose/pose-source';

/** Replays a recorded keypoint track at wall-clock speed, looping. Debug only. */
export class FixturePoseSource implements PoseSource {
  readonly kind = 'fixture' as const;
  private readonly listeners = new Set<(frame: PoseFrame) => void>();
  private readonly frames: PoseFrame[];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private index = 0;
  private loops = 0;

  constructor(fixture: PoseFixture) {
    this.frames = fixtureFrames(fixture);
  }

  async start(): Promise<void> {
    this.stop();
    this.index = 0;
    this.loops = 0;
    this.scheduleNext();
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  subscribe(listener: (frame: PoseFrame) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private scheduleNext(): void {
    const frame = this.frames[this.index];
    if (!frame) {
      return;
    }
    const duration = this.frames[this.frames.length - 1]?.tMs ?? 0;
    const offset = this.loops * (duration + 1000);
    const emitted = { ...frame, tMs: frame.tMs + offset };
    for (const listener of this.listeners) {
      listener(emitted);
    }
    this.index += 1;
    let delay: number;
    if (this.index >= this.frames.length) {
      this.index = 0;
      this.loops += 1;
      delay = 1000;
    } else {
      delay = Math.max(1, (this.frames[this.index]?.tMs ?? 0) - frame.tMs);
    }
    this.timer = setTimeout(() => this.scheduleNext(), delay);
  }
}
