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
// "killed" is a discussion step's don't-build ending: terminal and a success
// (early kill = money saved), never rendered with failure styling.
export const TERMINAL_STATES = ["done", "failed", "rejected", "cancelled", "killed"];
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
 * Which file holds the plan at the gate. Workflows may override it per gate
 * (self-review writes improvement-plan.md), so mirror what the engine reads:
 * the gate the run is parked on, else the first gate, else plan.md. Basename
 * only — the workflow file must never point the console outside the run dir.
 */
function gatePlanFile(steps, stepIndex) {
  const gates = steps.filter((s) => s && s.type === "gate");
  const current = typeof stepIndex === "number" ? steps[stepIndex] : null;
  const gate = current && current.type === "gate" ? current : gates[0];
  return path.basename((gate && gate.planFile) || "plan.md");
}

// Fixed set of run-dir logs the console may serve — a closed list, never
// dynamic names. Engine/executor always; the rest appear as their steps run.
const RUN_LOGS = ["engine", "executor", "setup", "checks", "tests", "deploy"];

// Per-attempt step documents the engine writes: <step>.prompt.md /
// <step>.output.json / <step>.transcript.jsonl for attempt 1, <step>.N.* for
// retries. Kind whitelist maps to the file extension.
const STEP_DOC_KINDS = { prompt: "prompt.md", output: "output.json", transcript: "transcript.jsonl" };
const KIND_BY_EXT = { "prompt.md": "prompt", "output.json": "output", "transcript.jsonl": "transcript" };
// Engine-synthetic step ids: spawned by the executor when needed (deploy
// conflict recovery), never declared in workflow JSON, but their per-attempt
// documents are served exactly like a declared step's.
const SYNTHETIC_STEP_IDS = ["resolve-conflicts"];
const STEP_ID_RE = /^[a-z0-9-]+$/;
const STEP_DOC_RE = /^([a-z0-9-]+)\.(?:(\d+)\.)?(prompt\.md|output\.json|transcript\.jsonl)$/;
const MAX_ATTEMPT = 999;
const STEP_DOC_CAP = 256 * 1024;
// Transcripts are full stream-json captures (MBs); serve a bigger tail than the
// prompt/output cap but still bounded — and only ever on explicit request (the
// run-detail payload lists attempt numbers, never transcript content).
const TRANSCRIPT_CAP = 1024 * 1024;

function stepDocFileName(stepId, kind, attempt) {
  const ext = STEP_DOC_KINDS[kind];
  return attempt <= 1 ? `${stepId}.${ext}` : `${stepId}.${attempt}.${ext}`;
}

/** Available attempts per step/kind from one readdir, restricted to the
 *  workflow-declared step ids: { [stepId]: { prompt: [1,2], output: [1] } }.
 *  Steps with no documents are omitted. */
function listStepDocs(runDir, stepIds) {
  const out = {};
  let names = [];
  try {
    names = fs.readdirSync(runDir);
  } catch {
    return out;
  }
  const declared = new Set(stepIds);
  for (const name of names) {
    const m = STEP_DOC_RE.exec(name);
    if (!m || !declared.has(m[1])) continue;
    const kind = KIND_BY_EXT[m[3]];
    const entry = (out[m[1]] ||= { prompt: [], output: [], transcript: [] });
    entry[kind].push(m[2] ? parseInt(m[2], 10) : 1);
  }
  for (const entry of Object.values(out)) {
    entry.prompt.sort((a, b) => a - b);
    entry.output.sort((a, b) => a - b);
    entry.transcript.sort((a, b) => a - b);
  }
  return out;
}

/** Step ids declared by a run's workflow file, or null when unloadable. */
function workflowStepIds(orchDir, workflowName) {
  if (typeof workflowName !== "string" || !STEP_ID_RE.test(workflowName)) return null;
  const workflow = readJson(path.join(orchDir, "workflows", `${workflowName}.json`), null);
  if (!workflow || !Array.isArray(workflow.steps)) return null;
  return workflow.steps.map((s) => s && s.id).filter((s) => typeof s === "string");
}

/**
 * One step attempt's rendered prompt or raw SDK output, tail-capped like logs.
 * `stepId` is validated against the run's workflow-declared step ids (never
 * used as a free-form path segment), `kind` against STEP_DOC_KINDS, `attempt`
 * as a bounded positive int (string form accepted; omitted/null = latest;
 * unsuffixed file = attempt 1). Returns { text } on success or
 * { status: 400|404, error } — never file content for invalid input.
 */
export function readStepDoc(orchDir, id, stepId, kind, attempt) {
  if (typeof id !== "string" || !RUN_ID_RE.test(id)) return { status: 400, error: "invalid run id" };
  if (typeof stepId !== "string" || !STEP_ID_RE.test(stepId)) return { status: 400, error: "invalid step id" };
  if (!Object.prototype.hasOwnProperty.call(STEP_DOC_KINDS, kind)) return { status: 400, error: "invalid kind" };
  let n = null;
  if (attempt !== undefined && attempt !== null && attempt !== "") {
    if (!/^\d{1,4}$/.test(String(attempt))) return { status: 400, error: "invalid attempt" };
    n = parseInt(attempt, 10);
    if (n < 1 || n > MAX_ATTEMPT) return { status: 400, error: "invalid attempt" };
  }
  const runDir = path.join(runsDirOf(orchDir), id);
  const run = readJson(path.join(runDir, "run.json"), null);
  if (!run || !run.id) return { status: 404, error: `no such run: ${id}` };
  const stepIds = workflowStepIds(orchDir, run.workflow);
  if (!stepIds) return { status: 404, error: `workflow '${run.workflow}' not found` };
  if (!stepIds.includes(stepId) && !SYNTHETIC_STEP_IDS.includes(stepId)) {
    return { status: 400, error: `step '${stepId}' not in workflow` };
  }
  if (n === null) {
    const attempts = (listStepDocs(runDir, [stepId])[stepId] || {})[kind] || [];
    if (attempts.length === 0) return { status: 404, error: "no such document" };
    n = attempts[attempts.length - 1];
  }
  const cap = kind === "transcript" ? TRANSCRIPT_CAP : STEP_DOC_CAP;
  const text = readCapped(path.join(runDir, stepDocFileName(stepId, kind, n)), cap);
  if (text === null) return { status: 404, error: "no such document" };
  return { text };
}

/**
 * Full detail for one run: run.json (or the DB row when the dir is gone),
 * telemetry step attempts + artifacts, the workflow definition, and the small
 * run-dir documents the founder needs at the gate (plan, findings, review,
 * steering, deviations) plus the available per-attempt step documents.
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
  const wfSteps = workflow && Array.isArray(workflow.steps) ? workflow.steps : [];
  const stepIds = wfSteps.map((s) => s && s.id).filter((s) => typeof s === "string");
  return {
    run: summary,
    repoUrl: repoUrlForRig(orchDir, summary.rig),
    history: (run && run.history) || [],
    steps: stepsForRun(db, id),
    artifacts: artifactsForRun(db, id),
    workflow,
    recovery: (run && run.recovery) || null,
    planMd: readCapped(path.join(runDir, gatePlanFile(wfSteps, summary.stepIndex))),
    findingsMd: readCapped(path.join(runDir, "findings.md")),
    steeringMd: readCapped(path.join(runDir, "steering.md")),
    deviationsMd: readCapped(path.join(runDir, "deviations.md")),
    conflictMd: readCapped(path.join(runDir, "conflict.md")),
    escalationMd: readCapped(path.join(runDir, "escalation.md")),
    review: readJson(path.join(runDir, "review.json"), null),
    stepDocs: listStepDocs(runDir, [...stepIds, ...SYNTHETIC_STEP_IDS]),
    logs: RUN_LOGS.filter((n) => fs.existsSync(path.join(runDir, `${n}.log`))),
  };
}

/** Tail of a run-dir log. Only whitelisted names — never arbitrary paths. */
export function readRunLog(orchDir, id, name) {
  if (!RUN_LOGS.includes(name)) return null;
  return readCapped(path.join(runsDirOf(orchDir), id, `${name}.log`), 256 * 1024);
}
