/*
 * Read-only access to orchestration/telemetry.db for the factory web console.
 * The engine (bin/factory-run) owns the schema; this module only ever opens the
 * database read-only and tolerates its absence (fresh installs have no DB yet).
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let _db = null;

/** Open the telemetry DB read-only, or return null if it does not exist. */
export function openTelemetry(orchDir) {
  const p = path.join(orchDir, "telemetry.db");
  if (!fs.existsSync(p)) return null;
  if (_db) return _db;
  try {
    _db = new DatabaseSync(p, { readOnly: true });
    return _db;
  } catch {
    return null;
  }
}

function safeAll(db, sql, ...params) {
  try {
    return db.prepare(sql).all(...params);
  } catch {
    return [];
  }
}

function safeGet(db, sql, ...params) {
  try {
    return db.prepare(sql).get(...params);
  } catch {
    return undefined;
  }
}

/** All rows from the runs table (may include runs whose dir was deleted). */
export function telemetryRuns(db) {
  if (!db) return [];
  return safeAll(db, `SELECT id, workflow, rig, prompt, state, auto, parent_run, created_at, finished_at FROM runs`);
}

/** Telemetry step attempts for one run, oldest first. */
export function stepsForRun(db, runId) {
  if (!db) return [];
  return safeAll(
    db,
    `SELECT step_id, attempt, status, summary, started_at, finished_at, duration_s,
            cost_usd, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens
     FROM steps WHERE run_id = ? ORDER BY started_at, attempt`,
    runId
  );
}

/** Artifact rows (commits, review verdicts/findings, deploy URLs) for one run. */
export function artifactsForRun(db, runId) {
  if (!db) return [];
  return safeAll(
    db,
    `SELECT step_id, type, value, created_at FROM artifacts WHERE run_id = ? ORDER BY created_at`,
    runId
  );
}

function usageFromRow(r) {
  if (!r || !r.priced_steps) return null;
  return {
    costUsd: r.cost || 0,
    // Same semantics as the engine's runUsage(): "in" includes cache reads/creation.
    inputTokens: (r.in_tok || 0) + (r.cache_read || 0) + (r.cache_create || 0),
    rawInputTokens: r.in_tok || 0,
    cacheReadTokens: r.cache_read || 0,
    cacheCreationTokens: r.cache_create || 0,
    outputTokens: r.out_tok || 0,
    pricedSteps: r.priced_steps || 0,
  };
}

/** Cost/token totals for one run, or null when nothing priced. */
export function usageForRun(db, runId) {
  if (!db) return null;
  const r = safeGet(
    db,
    `SELECT COALESCE(SUM(cost_usd),0) cost, COALESCE(SUM(input_tokens),0) in_tok,
            COALESCE(SUM(output_tokens),0) out_tok, COALESCE(SUM(cache_read_tokens),0) cache_read,
            COALESCE(SUM(cache_creation_tokens),0) cache_create,
            SUM(cost_usd IS NOT NULL) priced_steps
     FROM steps WHERE run_id = ?`,
    runId
  );
  return usageFromRow(r);
}

// Trailing windows for the Usage page, in days ("all" = no cutoff). One
// response carries every window so the 31d/7d/1d buttons are client toggles.
const USAGE_WINDOWS = { all: null, d31: 31, d7: 7, d1: 1 };

/** Repo bucket for a rig name: quickfire factory:<app> rigs collapse into one
 *  "factory-apps" bucket; every other rig (running-with-pace, skip-hero,
 *  app-factory, …) is its own repo. */
export function repoBucket(rig) {
  if (typeof rig !== "string" || !rig) return "unknown";
  return rig.startsWith("factory:") ? "factory-apps" : rig;
}

const EMPTY_WINDOW = () => ({
  costUsd: 0,
  inputTokens: 0,
  rawInputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  outputTokens: 0,
  pricedSteps: 0,
  runs: 0,
  repos: [],
});

function windowTotals(db, since) {
  const where = since === null ? "" : " WHERE s.started_at >= ?";
  const params = since === null ? [] : [since];
  const row = safeGet(
    db,
    `SELECT COALESCE(SUM(s.cost_usd),0) cost, COALESCE(SUM(s.input_tokens),0) in_tok,
            COALESCE(SUM(s.output_tokens),0) out_tok, COALESCE(SUM(s.cache_read_tokens),0) cache_read,
            COALESCE(SUM(s.cache_creation_tokens),0) cache_create,
            COALESCE(SUM(s.cost_usd IS NOT NULL),0) priced_steps,
            COUNT(DISTINCT s.run_id) run_count
     FROM steps s${where}`,
    ...params
  );
  const out = EMPTY_WINDOW();
  if (!row) return out;
  out.costUsd = row.cost || 0;
  // Same semantics as usageFromRow: "in" includes cache reads/creation.
  out.inputTokens = (row.in_tok || 0) + (row.cache_read || 0) + (row.cache_create || 0);
  out.rawInputTokens = row.in_tok || 0;
  out.cacheReadTokens = row.cache_read || 0;
  out.cacheCreationTokens = row.cache_create || 0;
  out.outputTokens = row.out_tok || 0;
  out.pricedSteps = row.priced_steps || 0;
  out.runs = row.run_count || 0;
  // Per-repo cost buckets (founder ask): join steps to runs for the rig; LEFT
  // JOIN so steps whose run row is gone still count (as "unknown").
  const rigRows = safeAll(
    db,
    `SELECT r.rig rig, COALESCE(SUM(s.cost_usd),0) cost,
            COALESCE(SUM(s.cost_usd IS NOT NULL),0) priced_steps,
            COUNT(DISTINCT s.run_id) run_count
     FROM steps s LEFT JOIN runs r ON r.id = s.run_id${where}
     GROUP BY r.rig`,
    ...params
  );
  const buckets = new Map();
  for (const r of rigRows) {
    const key = repoBucket(r.rig);
    const b = buckets.get(key) || { repo: key, costUsd: 0, pricedSteps: 0, runs: 0 };
    b.costUsd += r.cost || 0;
    b.pricedSteps += r.priced_steps || 0;
    b.runs += r.run_count || 0;
    buckets.set(key, b);
  }
  out.repos = [...buckets.values()].sort((a, b) => b.costUsd - a.costUsd);
  return out;
}

/**
 * Cost/token aggregates for the Usage page: all-time plus trailing 31d/7d/1d
 * windows over steps.started_at (ISO strings compare lexicographically), each
 * with per-repo cost buckets. Zeroed structure when the DB is absent. `now` is
 * injectable for tests.
 */
export function usageTotals(db, now = new Date()) {
  const out = {};
  for (const [key, days] of Object.entries(USAGE_WINDOWS)) {
    if (!db) {
      out[key] = EMPTY_WINDOW();
      continue;
    }
    const since = days === null ? null : new Date(now.getTime() - days * 86400e3).toISOString();
    out[key] = windowTotals(db, since);
  }
  return out;
}

/** Cost/token totals for every run in one query: { [runId]: usage }. */
export function usageByRun(db) {
  if (!db) return {};
  const rows = safeAll(
    db,
    `SELECT run_id, COALESCE(SUM(cost_usd),0) cost, COALESCE(SUM(input_tokens),0) in_tok,
            COALESCE(SUM(output_tokens),0) out_tok, COALESCE(SUM(cache_read_tokens),0) cache_read,
            COALESCE(SUM(cache_creation_tokens),0) cache_create,
            SUM(cost_usd IS NOT NULL) priced_steps
     FROM steps GROUP BY run_id`
  );
  const out = {};
  for (const r of rows) {
    const u = usageFromRow(r);
    if (u) out[r.run_id] = u;
  }
  return out;
}
