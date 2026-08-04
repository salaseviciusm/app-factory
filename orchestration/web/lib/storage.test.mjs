/* Tests for storage.mjs context-storage breakdown — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { contextStorage } from "./storage.mjs";

/** Build a throwaway repo tree (repoRoot/orchestration/...) plus a fake home. */
function makeTree(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storage-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repoRoot = path.join(root, "repo");
  const home = path.join(root, "home");
  const write = (rel, text) => {
    const p = path.join(repoRoot, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  };
  write("orchestration/telemetry.db", "0123456789"); // 10 bytes
  write("orchestration/runs/r1/implement.transcript.jsonl", "x".repeat(20));
  write("orchestration/runs/r1/implement.2.transcript.jsonl", "x".repeat(30));
  write("orchestration/runs/r1/implement.prompt.md", "x".repeat(5));
  write("orchestration/runs/r1/implement.output.json", "x".repeat(7));
  write("orchestration/runs/r1/engine.log", "x".repeat(3));
  write("orchestration/runs/r1/plan.md", "x".repeat(4)); // run-other
  write("orchestration/prompts/implementer.md", "x".repeat(6));
  write("docs/a.md", "x".repeat(8));
  write("agents/b.md", "x".repeat(2));
  write("playbooks/deep/c.md", "x".repeat(1));
  write("openclaw/x.md", "x".repeat(9));
  write("openclaw/apply.sh", "x".repeat(100)); // non-md under openclaw: excluded
  write("README.md", "x".repeat(11));
  write("docs/nested/notes.txt", "x".repeat(40)); // whole-dir category: counted
  const sessions = path.join(home, ".openclaw", "agents", "main", "sessions");
  fs.mkdirSync(sessions, { recursive: true });
  fs.writeFileSync(path.join(sessions, "s1.jsonl"), "x".repeat(13));
  return { orchDir: path.join(repoRoot, "orchestration"), repoRoot, home };
}

function byKey(result) {
  return Object.fromEntries(result.categories.map((c) => [c.key, c]));
}

test("contextStorage breaks the tree down by category", (t) => {
  const { orchDir, home } = makeTree(t);
  const cats = byKey(contextStorage(orchDir, home));
  assert.deepEqual(cats["telemetry-db"], { key: "telemetry-db", label: "telemetry.db", bytes: 10, files: 1 });
  assert.equal(cats["run-transcripts"].bytes, 50);
  assert.equal(cats["run-transcripts"].files, 2);
  assert.equal(cats["run-prompts"].bytes, 5);
  assert.equal(cats["run-outputs"].bytes, 7);
  assert.equal(cats["run-logs"].bytes, 3);
  assert.equal(cats["run-other"].bytes, 4);
  assert.equal(cats["orch-prompts"].bytes, 6);
  // docs (8 + 40 non-md counted: whole dir) + agents 2 + playbooks 1 + openclaw md 9 + root README 11.
  assert.equal(cats["factory-markdown"].bytes, 71);
  assert.equal(cats["factory-markdown"].files, 6);
  assert.equal(cats["openclaw-sessions"].bytes, 13);
});

test("contextStorage totals sum the categories", (t) => {
  const { orchDir, home } = makeTree(t);
  const result = contextStorage(orchDir, home);
  assert.equal(
    result.totalBytes,
    result.categories.reduce((s, c) => s + c.bytes, 0)
  );
  assert.equal(result.totalBytes, 10 + 50 + 5 + 7 + 3 + 4 + 6 + 71 + 13);
  assert.equal(
    result.totalFiles,
    result.categories.reduce((s, c) => s + c.files, 0)
  );
});

test("contextStorage reports missing roots as zero, never throws", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storage-empty-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = contextStorage(path.join(root, "repo", "orchestration"), path.join(root, "no-home"));
  assert.equal(result.totalBytes, 0);
  assert.equal(result.totalFiles, 0);
  for (const c of result.categories) assert.deepEqual([c.bytes, c.files], [0, 0]);
});

test("contextStorage never follows symlinks", (t) => {
  const { orchDir, repoRoot, home } = makeTree(t);
  const outside = path.join(repoRoot, "..", "outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "huge.transcript.jsonl"), "x".repeat(5000));
  fs.symlinkSync(outside, path.join(orchDir, "runs", "r1", "linked-dir"));
  fs.symlinkSync(path.join(outside, "huge.transcript.jsonl"), path.join(orchDir, "runs", "r1", "linked.transcript.jsonl"));
  const cats = byKey(contextStorage(orchDir, home));
  assert.equal(cats["run-transcripts"].bytes, 50); // symlinked file and dir untouched
});
