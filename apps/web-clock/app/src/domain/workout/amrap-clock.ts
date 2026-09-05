/**
 * Countdown that only knows about the timestamps it is handed. The shell ticks it;
 * the director reads it. Pausing accumulates paused time so wall-clock jumps
 * (backgrounding, a phone call) do not eat the athlete's twenty minutes unnoticed.
 */
export class AmrapClock {
  private startedAt: number | undefined;
  private pausedAt: number | undefined;
  private pausedTotal = 0;

  constructor(readonly durationMs: number) {}

  start(nowMs: number): void {
    this.startedAt = nowMs;
    this.pausedAt = undefined;
    this.pausedTotal = 0;
  }

  pause(nowMs: number): void {
    if (this.startedAt !== undefined && this.pausedAt === undefined) {
      this.pausedAt = nowMs;
    }
  }

  resume(nowMs: number): void {
    if (this.pausedAt !== undefined) {
      this.pausedTotal += nowMs - this.pausedAt;
      this.pausedAt = undefined;
    }
  }

  get running(): boolean {
    return this.startedAt !== undefined && this.pausedAt === undefined;
  }

  elapsed(nowMs: number): number {
    if (this.startedAt === undefined) {
      return 0;
    }
    const until = this.pausedAt ?? nowMs;
    return Math.max(0, until - this.startedAt - this.pausedTotal);
  }

  remaining(nowMs: number): number {
    return Math.max(0, this.durationMs - this.elapsed(nowMs));
  }

  isOver(nowMs: number): boolean {
    return this.startedAt !== undefined && this.remaining(nowMs) === 0;
  }
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
