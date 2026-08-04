/* Tests for db.mjs usage aggregation — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { usageTotals, repoBucket } from "./db.mjs";

const NOW = new Date("2026-08-04T00:00:00.000Z");

function iso(hoursAgo) {
  return new Date(NOW.getTime() - hoursAgo * 3600e3).toISOString();
}

/** Build a throwaway telemetry DB mirroring the engine's schema. */
function makeDb(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "db-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const db = new DatabaseSync(path.join(dir, "telemetry.db"));
  db.exec(`
    CREATE TABLE runs (
      id TEXT PRIMARY KEY, workflow TEXT, rig TEXT, prompt TEXT, state TEXT,
      auto INTEGER, parent_run TEXT, created_at TEXT, finished_at TEXT
    );
    CREATE TABLE steps (
      run_id TEXT, step_id TEXT, attempt INTEGER, status TEXT, summary TEXT,
      started_at TEXT, finished_at TEXT, duration_s REAL,
      cost_usd REAL, input_tokens INTEGER, output_tokens INTEGER,
      cache_read_tokens INTEGER, cache_creation_tokens INTEGER
    );
  `);
  const addRun = db.prepare(`INSERT INTO runs (id, rig) VALUES (?, ?)`);
  const addStep = db.prepare(
    `INSERT INTO steps (run_id, step_id, attempt, status, started_at, cost_usd,
       input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens)
     VALUES (?, ?, 1, 'ok', ?, ?, ?, ?, ?, ?)`
  );
  addRun.run("pace-run", "running-with-pace");
  addRun.run("hero-run", "skip-hero");
  addRun.run("orch-run", "app-factory");
  addRun.run("app-a-run", "factory:app-a");
  addRun.run("app-b-run", "factory:app-b");
  addStep.run("pace-run", "implement", iso(2), 1.0, 100, 50, 10, 5); // in d1
  addStep.run("pace-run", "review", iso(3 * 24), 2.0, 200, 100, 20, 10); // in d7
  addStep.run("pace-run", "plan-gate", iso(2), null, null, null, null, null); // unpriced
  addStep.run("hero-run", "implement", iso(10 * 24), 4.0, 400, 200, 40, 20); // in d31
  addStep.run("orch-run", "implement", iso(60 * 24), 8.0, 800, 400, 80, 40); // all-time only
  addStep.run("app-a-run", "build", iso(2 * 24), 0.5, 50, 25, 0, 0); // in d7
  addStep.run("app-b-run", "build", iso(2 * 24), 0.25, 25, 12, 0, 0); // in d7
  addStep.run("gone-run", "implement", iso(1), 0.125, 10, 5, 0, 0); // run row deleted
  return db;
}

test("repoBucket collapses quickfire apps and tolerates junk", () => {
  assert.equal(repoBucket("running-with-pace"), "running-with-pace");
  assert.equal(repoBucket("factory:app-a"), "factory-apps");
  assert.equal(repoBucket("factory:app-b"), "factory-apps");
  assert.equal(repoBucket(null), "unknown");
  assert.equal(repoBucket(""), "unknown");
});

test("usageTotals sums all-time and trailing 31d/7d/1d windows", (t) => {
  const totals = usageTotals(makeDb(t), NOW);
  assert.equal(totals.all.costUsd, 15.875);
  assert.equal(totals.d31.costUsd, 7.875);
  assert.equal(totals.d7.costUsd, 3.875);
  assert.equal(totals.d1.costUsd, 1.125);
  // Token semantics match usageForRun: inputTokens includes cache reads/creation.
  assert.equal(totals.d1.rawInputTokens, 110);
  assert.equal(totals.d1.inputTokens, 110 + 10 + 5);
  assert.equal(totals.d1.outputTokens, 55);
  // Unpriced gate rows never count as priced steps but their run still counts.
  assert.equal(totals.all.pricedSteps, 7);
  assert.equal(totals.all.runs, 6);
  assert.equal(totals.d1.runs, 2);
});

test("usageTotals buckets cost per repo, quickfire apps combined", (t) => {
  const totals = usageTotals(makeDb(t), NOW);
  assert.deepEqual(
    totals.all.repos.map((r) => [r.repo, r.costUsd]),
    [
      ["app-factory", 8.0],
      ["skip-hero", 4.0],
      ["running-with-pace", 3.0],
      ["factory-apps", 0.75],
      ["unknown", 0.125],
    ]
  );
  // Windows narrow the buckets too: only pace and the orphan step are in d1.
  assert.deepEqual(
    totals.d1.repos.map((r) => [r.repo, r.costUsd]),
    [
      ["running-with-pace", 1.0],
      ["unknown", 0.125],
    ]
  );
});

test("usageTotals returns a zeroed structure when the DB is absent", () => {
  const totals = usageTotals(null, NOW);
  for (const key of ["all", "d31", "d7", "d1"]) {
    assert.equal(totals[key].costUsd, 0);
    assert.equal(totals[key].pricedSteps, 0);
    assert.equal(totals[key].runs, 0);
    assert.deepEqual(totals[key].repos, []);
  }
});
