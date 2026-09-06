#!/usr/bin/env node
// Convert a pose-extract / posespike CSV (Vision coords: origin bottom-left, y up) into a
// keypoint fixture the FixturePoseSource and the goldens replay.
//
//   node tools/csv-to-fixture.mjs <in.csv> <out.json> [options]
//
//   --label "8 strict pull-ups, front"   free text stored in the fixture
//   --from 12.5 --to 41                 keep only this window (seconds in the source
//                                        clip); frames are re-timed to start at 0
//   --size 1080x1920                    frame size after rotation (pose-extract prints
//                                        it on stderr); default 1280x720 for spike CSVs
//
// Fixtures hold keypoints only — never pixels — so they are safe to commit.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error(
    'usage: csv-to-fixture <in.csv> <out.json> [--label text] [--from s] [--to s] [--size WxH]',
  );
  process.exit(2);
}

const option = (name) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};
const label = option('--label');
const fromSec = Number(option('--from') ?? 0);
const toSec = Number(option('--to') ?? Number.POSITIVE_INFINITY);
const [width, height] = (option('--size') ?? '1280x720').split('x').map(Number);
if (!Number.isFinite(fromSec) || !Number.isFinite(toSec) || fromSec >= toSec) {
  console.error('--from must be less than --to');
  process.exit(2);
}
if (!Number.isFinite(width) || !Number.isFinite(height)) {
  console.error('--size must look like 1080x1920');
  process.exit(2);
}

const COLUMN_TO_JOINT = {
  nose: 'nose',
  lSho: 'leftShoulder',
  rSho: 'rightShoulder',
  lElb: 'leftElbow',
  rElb: 'rightElbow',
  lWri: 'leftWrist',
  rWri: 'rightWrist',
  lHip: 'leftHip',
  rHip: 'rightHip',
  lKne: 'leftKnee',
  rKne: 'rightKnee',
  lAnk: 'leftAnkle',
  rAnk: 'rightAnkle',
  neck: 'neck',
};

const lines = readFileSync(input, 'utf8').trim().split('\n');
const header = lines[0].split(',');
const frames = [];
let originMs;
for (const line of lines.slice(1)) {
  const cells = line.split(',');
  const row = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  const tSec = Number(row.t_sec);
  if (tSec < fromSec || tSec > toSec) {
    continue;
  }
  const tMs = Math.round(tSec * 1000);
  originMs ??= tMs;
  const joints = {};
  for (const [column, jointName] of Object.entries(COLUMN_TO_JOINT)) {
    const c = Number(row[`${column}_conf`]);
    const x = Number(row[`${column}_x`]);
    const y = Number(row[`${column}_y`]);
    if (!Number.isFinite(c) || c <= 0 || x < 0 || y < 0) {
      continue;
    }
    joints[jointName] = [round(x), round(1 - y), round(c)];
  }
  frames.push({ t: tMs - originMs, j: joints });
}

if (frames.length === 0) {
  console.error(`no frames between ${fromSec}s and ${toSec}s`);
  process.exit(1);
}

const window = Number.isFinite(toSec) || fromSec > 0 ? { fromSec, toSec } : undefined;
const fixture = {
  version: 1,
  source: input.split('/').slice(-1)[0],
  label,
  ...(window ? { window } : {}),
  coords: 'normalized-top-left-y-down',
  width,
  height,
  frames,
};
writeFileSync(output, JSON.stringify(fixture));
console.log(`${output}: ${frames.length} frames, ${((frames.at(-1)?.t ?? 0) / 1000).toFixed(1)} s`);

function round(n) {
  return Math.round(n * 1000) / 1000;
}
