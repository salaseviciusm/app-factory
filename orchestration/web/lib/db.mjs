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
