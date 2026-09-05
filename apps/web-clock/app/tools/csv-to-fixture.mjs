#!/usr/bin/env node
// Convert a posespike CSV (apps/pullup/spikes/001, Vision coords: origin bottom-left,
// y up) into a keypoint fixture the FixturePoseSource and the goldens replay.
//
//   node tools/csv-to-fixture.mjs <in.csv> <out.json> [--label "3 pull-ups, front"]
//
// Fixtures hold keypoints only — never pixels — so they are safe to commit.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error('usage: csv-to-fixture <in.csv> <out.json> [--label text]');
  process.exit(2);
}
const labelIndex = rest.indexOf('--label');
const label = labelIndex >= 0 ? rest[labelIndex + 1] : undefined;

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
for (const line of lines.slice(1)) {
  const cells = line.split(',');
  const row = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
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
  frames.push({ t: Math.round(Number(row.t_sec) * 1000), j: joints });
}

const fixture = {
  version: 1,
  source: input.split('/').slice(-1)[0],
  label,
  coords: 'normalized-top-left-y-down',
  width: 1280,
  height: 720,
  frames,
};
writeFileSync(output, JSON.stringify(fixture));
console.log(`${output}: ${frames.length} frames, ${((frames.at(-1)?.t ?? 0) / 1000).toFixed(1)} s`);

function round(n) {
  return Math.round(n * 1000) / 1000;
}
