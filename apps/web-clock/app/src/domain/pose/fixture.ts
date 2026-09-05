import type { Joint, JointPoint, PoseFrame } from './pose-frame.js';

/** Keypoint track on disk. Produced by tools/csv-to-fixture.mjs; never contains pixels. */
export interface PoseFixture {
  readonly version: 1;
  readonly source: string;
  readonly label?: string;
  readonly coords: 'normalized-top-left-y-down';
  readonly width: number;
  readonly height: number;
  readonly frames: ReadonlyArray<{
    readonly t: number;
    readonly j: Readonly<Record<string, readonly [number, number, number]>>;
  }>;
}

export function fixtureFrames(fixture: PoseFixture): PoseFrame[] {
  return fixture.frames.map((f) => {
    const joints: Partial<Record<Joint, JointPoint>> = {};
    for (const [name, [x, y, c]] of Object.entries(f.j)) {
      joints[name as Joint] = { x, y, c };
    }
    return { tMs: f.t, joints, width: fixture.width, height: fixture.height };
  });
}
