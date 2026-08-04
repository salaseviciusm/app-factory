/*
 * Run readers for the factory web console: merge orchestration/runs/<id>/run.json
 * (the engine's source of truth) with the telemetry DB (cost/tokens, and runs
 * whose dir was deleted). Read-only — all mutations go through bin/factory-run.
 */
import fs from "node:fs";
import path from "node:path";
import { openTelemetry, telemetryRuns, stepsForRun, artifactsForRun, usageForRun, usageByRun } from "./db.mjs";
import { repoUrlForRig } from "./github.mjs";

export const RUN_ID_RE = /^[a-z0-9-]+$/;
export const TERMINAL_STATES = ["done", "failed", "rejected", "cancelled"];
const STALL_MS = 10 * 60 * 1000;

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function runsDirOf(orchDir) {
  return path.join(orchDir, "runs");
}

function isStalled(state, updatedAt) {
  if (!state || TERMINAL_STATES.includes(state) || state === "awaiting-approval") return false;
  const t = Date.parse(updatedAt || "");
  return Number.isFinite(t) && Date.now() - t > STALL_MS;
}

function worktreeMissing(run) {
  return Boolean(run.worktree) && !fs.existsSync(run.worktree);
}

function summaryFromRunJson(run, usage) {
  return {
    id: run.id,
    workflow: run.workflow,
    rig: run.rig,
    prompt: run.prompt || "",
    state: run.state,
    auto: !!run.auto,
    parentRun: run.parentRun || null,
    childRun: run.childRun || null,
    stepIndex: run.stepIndex ?? 0,
    artifactUrl: run.artifactUrl || null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    worktreeMissing: worktreeMissing(run),
    stalled: isStalled(run.state, run.updatedAt),
    source: "dir",
    usage: usage || null,
  };
}

function summaryFromDbRow(r, usage) {
  return {
    id: r.id,
    workflow: r.workflow,
    rig: r.rig,
    prompt: r.prompt || "",
    state: r.state,
    auto: !!r.auto,
    parentRun: r.parent_run || null,
    childRun: null,
    stepIndex: null,
    artifactUrl: null,
    createdAt: r.created_at,
    updatedAt: r.finished_at || r.created_at,
    worktreeMissing: false,
    stalled: isStalled(r.state, r.finished_at || r.created_at),
    source: "db",
    usage: usage || null,
  };
}

/** All runs, merged from run dirs and the telemetry runs table, newest first. */
export function listRuns(orchDir) {
  const db = openTelemetry(orchDir);
  const usage = usageByRun(db);
  const byId = new Map();
  const runsDir = runsDirOf(orchDir);
  if (fs.existsSync(runsDir)) {
    for (const d of fs.readdirSync(runsDir)) {
      if (!RUN_ID_RE.test(d)) continue;
      const run = readJson(path.join(runsDir, d, "run.json"), null);
      if (run && run.id) byId.set(run.id, summaryFromRunJson(run, usage[run.id]));
    }
  }
  for (const r of telemetryRuns(db)) {
    if (!r.id) continue;
    if (byId.has(r.id)) byId.get(r.id).source = "both";
    else byId.set(r.id, summaryFromDbRow(r, usage[r.id]));
  }
  return [...byId.values()].sort((a, b) => ((a.createdAt || "") < (b.createdAt || "") ? 1 : -1));
}

function readCapped(p, cap = 200 * 1024) {
  try {
    const st = fs.statSync(p);
    if (!st.isFile()) return null;
    const text = fs.readFileSync(p, "utf8");
    return text.length > cap ? text.slice(text.length - cap) : text;
  } catch {
    return null;
  }
}

/**
 * Full detail for one run: run.json (or the DB row when the dir is gone),
 * telemetry step attempts + artifacts, the workflow definition, and the small
 * run-dir documents the founder needs at the gate (plan, findings, review).
 * Returns null when the run exists nowhere. `id` must already be validated.
 */
export function getRunDetail(orchDir, id) {
  const db = openTelemetry(orchDir);
  const runDir = path.join(runsDirOf(orchDir), id);
  const run = readJson(path.join(runDir, "run.json"), null);
  let summary = null;
  if (run && run.id) {
    summary = summaryFromRunJson(run, usageForRun(db, id));
  } else {
    const row = telemetryRuns(db).find((r) => r.id === id);
    if (!row) return null;
    summary = summaryFromDbRow(row, usageForRun(db, id));
  }
  const workflow = readJson(path.join(orchDir, "workflows", `${summary.workflow}.json`), null);
  return {
    run: summary,
    repoUrl: repoUrlForRig(orchDir, summary.rig),
    history: (run && run.history) || [],
    steps: stepsForRun(db, id),
    artifacts: artifactsForRun(db, id),
    workflow,
    planMd: readCapped(path.join(runDir, "plan.md")),
    findingsMd: readCapped(path.join(runDir, "findings.md")),
    review: readJson(path.join(runDir, "review.json"), null),
    logs: ["engine", "executor"].filter((n) => fs.existsSync(path.join(runDir, `${n}.log`))),
  };
}

/** Tail of a run-dir log. Only whitelisted names — never arbitrary paths. */
export function readRunLog(orchDir, id, name) {
  if (!["engine", "executor"].includes(name)) return null;
  return readCapped(path.join(runsDirOf(orchDir), id, `${name}.log`), 256 * 1024);
}
