import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createDetector } from '../src/domain/detectors/index.js';
import {
  RX_PLAN,
  type Move,
  type RejectReason,
  type VariantPlan,
} from '../src/domain/detectors/detector.js';
import { loadFixture, run } from './helpers.js';

/**
 * Goldens: every `fixtures/<move>/<name>.json` with a sibling `<name>.expect.json` is
 * replayed through the detector for that move. Footage day workflow: extract → fixture →
 * write what you actually did into the expect file → make the detector agree.
 */
interface Expectation {
  readonly counted: number;
  /** Tolerance on `counted`; default 0 — footage is the truth. */
  readonly tolerance?: number;
  readonly plan?: Partial<VariantPlan>;
  readonly maxRejects?: number;
  readonly rejectsMustInclude?: RejectReason[];
  readonly note?: string;
}

/**
 * Negative goldens: `fixtures/negative/<name>.json` holds a movement none of the detectors
 * should count (rows, burpees, walking to the bar). Every detector runs over it; each may
 * count at most `maxCounted[move]` (default 0).
 */
interface NegativeExpectation {
  readonly maxCounted?: Partial<Record<Move, number>>;
  readonly plan?: Partial<VariantPlan>;
  readonly note?: string;
}

const root = new URL('../fixtures/', import.meta.url);
const moves: Move[] = ['pullup', 'pushup', 'squat'];

function goldenNames(folder: string): string[] {
  try {
    return readdirSync(new URL(`${folder}/`, root))
      .filter((f) => f.endsWith('.expect.json'))
      .map((f) => f.replace('.expect.json', ''));
  } catch {
    return [];
  }
}

describe('negative goldens', () => {
  const names = goldenNames('negative');
  it.skipIf(names.length > 0)('none recorded yet — see fixtures/README.md', () => {});
  for (const name of names) {
    it(`negative/${name}`, () => {
      const expectation = JSON.parse(
        readFileSync(new URL(`negative/${name}.expect.json`, root), 'utf8'),
      ) as NegativeExpectation;
      const plan: VariantPlan = { ...RX_PLAN, ...expectation.plan };
      const frames = loadFixture(`negative/${name}`);
      for (const move of moves) {
        const result = run(createDetector(move, plan), frames);
        expect(result.counted, `${move} counted`).toBeLessThanOrEqual(
          expectation.maxCounted?.[move] ?? 0,
        );
      }
    });
  }
});

describe('fixture goldens', () => {
  for (const move of moves) {
    for (const name of goldenNames(move)) {
      it(`${move}/${name}`, () => {
        const expectation = JSON.parse(
          readFileSync(new URL(`${move}/${name}.expect.json`, root), 'utf8'),
        ) as Expectation;
        const plan: VariantPlan = { ...RX_PLAN, ...expectation.plan };
        const result = run(createDetector(move, plan), loadFixture(`${move}/${name}`));
        const tolerance = expectation.tolerance ?? 0;
        expect(result.counted).toBeGreaterThanOrEqual(expectation.counted - tolerance);
        expect(result.counted).toBeLessThanOrEqual(expectation.counted + tolerance);
        if (expectation.maxRejects !== undefined) {
          expect(result.rejects.length).toBeLessThanOrEqual(expectation.maxRejects);
        }
        for (const reason of expectation.rejectsMustInclude ?? []) {
          expect(result.rejects).toContain(reason);
        }
      });
    }
  }
});
