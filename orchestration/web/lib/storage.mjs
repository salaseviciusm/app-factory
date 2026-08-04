/*
 * Context-storage breakdown for the factory web console's Usage page: how much
 * disk the factory's captured context occupies, by category. Read-only walks
 * over fixed roots derived from orchDir (never client-supplied paths), depth-
 * capped, symlinks not followed, missing roots reported as zero — never thrown.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_DEPTH = 8;

function emptyBucket() {
  return { bytes: 0, files: 0 };
}

function addFile(bucket, filePath) {
  try {
    const st = fs.lstatSync(filePath);
    if (!st.isFile()) return;
    bucket.bytes += st.size;
    bucket.files += 1;
  } catch {
    /* raced deletion — skip */
  }
}

/**
 * Walk `root` accumulating file sizes into buckets. `classify(name)` picks the
 * bucket key for each regular file (return null/undefined to skip it).
 * Symlinks are never followed, recursion is depth-capped, unreadable
 * directories contribute nothing.
 */
function walk(root, buckets, classify, depth = MAX_DEPTH) {
  if (depth < 0) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const p = path.join(root, e.name);
    if (e.isDirectory()) walk(p, buckets, classify, depth - 1);
    else if (e.isFile()) {
      const key = classify(e.name);
      if (key && buckets[key]) addFile(buckets[key], p);
    }
  }
}

/** Run-dir document kind by file name — mirrors the engine's capture names. */
function runFileKind(name) {
  if (name.endsWith(".transcript.jsonl")) return "run-transcripts";
  if (name.endsWith(".prompt.md")) return "run-prompts";
  if (name.endsWith(".output.json")) return "run-outputs";
  if (name.endsWith(".log")) return "run-logs";
  return "run-other";
}

const CATEGORY_LABELS = {
  "telemetry-db": "telemetry.db",
  "run-transcripts": "run transcripts",
  "run-prompts": "run prompts",
  "run-outputs": "run outputs",
  "run-logs": "run logs",
  "run-other": "run other files",
  "orch-prompts": "orchestration prompts",
  "factory-markdown": "factory markdown",
  "openclaw-sessions": "openclaw sessions",
};

/**
 * Category breakdown of the factory's context footprint on disk:
 * telemetry.db, runs/ split by document kind, orchestration prompts, the
 * factory markdown corpus (docs/, agents/, playbooks/, openclaw *.md, root
 * *.md), and the OpenClaw sessions dir. Returns
 * { categories: [{ key, label, bytes, files }], totalBytes, totalFiles }.
 * `home` is injectable for tests.
 */
export function contextStorage(orchDir, home = os.homedir()) {
  const repoRoot = path.resolve(orchDir, "..");
  const buckets = {};
  for (const key of Object.keys(CATEGORY_LABELS)) buckets[key] = emptyBucket();

  // telemetry.db plus its sqlite sidecars, if present.
  for (const n of ["telemetry.db", "telemetry.db-wal", "telemetry.db-shm"]) {
    addFile(buckets["telemetry-db"], path.join(orchDir, n));
  }

  walk(path.join(orchDir, "runs"), buckets, runFileKind);
  walk(path.join(orchDir, "prompts"), buckets, () => "orch-prompts");

  // Factory markdown corpus: whole dirs for docs/agents/playbooks, *.md only
  // under openclaw/ and at the repo root (depth 0 — no recursion).
  for (const dir of ["docs", "agents", "playbooks"]) {
    walk(path.join(repoRoot, dir), buckets, () => "factory-markdown");
  }
  walk(path.join(repoRoot, "openclaw"), buckets, (n) => (n.endsWith(".md") ? "factory-markdown" : null));
  walk(repoRoot, buckets, (n) => (n.endsWith(".md") ? "factory-markdown" : null), 0);

  walk(path.join(home, ".openclaw", "agents", "main", "sessions"), buckets, () => "openclaw-sessions");

  const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    bytes: buckets[key].bytes,
    files: buckets[key].files,
  }));
  return {
    categories,
    totalBytes: categories.reduce((s, c) => s + c.bytes, 0),
    totalFiles: categories.reduce((s, c) => s + c.files, 0),
  };
}
