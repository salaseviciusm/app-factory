/* Tests for files.mjs allowlisted file browsing — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { FILE_ROOTS, listFileRoots, resolveFileDownload } from "./files.mjs";

/** Build a throwaway fake home containing all allowlisted roots. */
function makeHome(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "files-test-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const examples = path.join(home, "src", "skip-hero", "examples");
  const debug = path.join(home, "src", "skip-hero", "debug");
  const documents = path.join(home, "src", "skip-hero", "documents");
  const factoryDocs = path.join(home, "src", "app-factory", "docs");
  const write = (base, rel, text, mtime) => {
    const p = path.join(base, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
    if (mtime) fs.utimesSync(p, mtime, mtime);
  };
  write(examples, "run.golden.json", "{}", new Date("2026-01-01T00:00:00Z"));
  write(examples, "clips/warmup.mov", "x".repeat(64), new Date("2026-03-01T00:00:00Z"));
  write(debug, "render.debug.mov", "x".repeat(128), new Date("2026-02-01T00:00:00Z"));
  write(debug, "pose/frame-1.png", "x".repeat(32), new Date("2026-02-02T00:00:00Z"));
  write(documents, "skip-hero-architecture.md", "# Architecture\n", new Date("2026-04-01T00:00:00Z"));
  write(documents, "decisions/0001-adr.md", "# ADR 1\n", new Date("2026-04-02T00:00:00Z"));
  write(factoryDocs, "marketing/platforms/tiktok/algorithm.md", "# TikTok\n", new Date("2026-05-01T00:00:00Z"));
  write(factoryDocs, "marketing/synthesis/playbook.md", "# Playbook\n", new Date("2026-05-02T00:00:00Z"));
  return { home, examples, debug, documents, factoryDocs };
}

function rootByKey(roots, key) {
  return roots.find((r) => r.key === key);
}

test("listFileRoots lists both allowlisted roots newest-first with totals", (t) => {
  const { home } = makeHome(t);
  const roots = listFileRoots(home);
  assert.deepEqual(
    roots.map((r) => r.key),
    FILE_ROOTS.map((r) => r.key)
  );
  const examples = rootByKey(roots, "skip-hero-examples");
  assert.equal(examples.exists, true);
  assert.equal(examples.count, 2);
  assert.equal(examples.totalBytes, 2 + 64);
  assert.equal(examples.truncated, false);
  // Newest first: the March clip before the January golden file.
  assert.deepEqual(
    examples.files.map((f) => f.path),
    ["clips/warmup.mov", "run.golden.json"]
  );
  assert.equal(examples.files[0].bytes, 64);
  assert.ok(examples.files[0].mtime.startsWith("2026-03-01"));
  const debug = rootByKey(roots, "skip-hero-debug");
  assert.deepEqual(
    debug.files.map((f) => f.path),
    ["pose/frame-1.png", "render.debug.mov"]
  );
  const documents = rootByKey(roots, "skip-hero-documents");
  assert.equal(documents.exists, true);
  assert.equal(documents.path, "~/src/skip-hero/documents");
  assert.deepEqual(
    documents.files.map((f) => f.path),
    ["decisions/0001-adr.md", "skip-hero-architecture.md"]
  );
  const factoryDocs = rootByKey(roots, "app-factory-docs");
  assert.equal(factoryDocs.exists, true);
  assert.equal(factoryDocs.path, "~/src/app-factory/docs");
  assert.equal(factoryDocs.count, 2);
  assert.deepEqual(
    factoryDocs.files.map((f) => f.path),
    ["marketing/synthesis/playbook.md", "marketing/platforms/tiktok/algorithm.md"]
  );
});

test("listFileRoots reports a missing root as an empty listing, never a throw", (t) => {
  const { home, debug } = makeHome(t);
  fs.rmSync(debug, { recursive: true, force: true });
  const roots = listFileRoots(home);
  const gone = rootByKey(roots, "skip-hero-debug");
  assert.deepEqual(
    { exists: gone.exists, files: gone.files, count: gone.count, totalBytes: gone.totalBytes },
    { exists: false, files: [], count: 0, totalBytes: 0 }
  );
  assert.equal(rootByKey(roots, "skip-hero-examples").count, 2);
});

test("listFileRoots excludes symlinks that escape the root", (t) => {
  const { home, debug } = makeHome(t);
  const outside = path.join(home, "outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "secret.png"), "x".repeat(999));
  fs.symlinkSync(path.join(outside, "secret.png"), path.join(debug, "escape.png"));
  fs.symlinkSync(outside, path.join(debug, "escape-dir"));
  // A symlink staying inside the root is fine.
  fs.symlinkSync(path.join(debug, "render.debug.mov"), path.join(debug, "alias.mov"));
  const debugRoot = rootByKey(listFileRoots(home), "skip-hero-debug");
  const names = debugRoot.files.map((f) => f.path);
  assert.ok(!names.includes("escape.png"));
  assert.ok(!names.some((n) => n.startsWith("escape-dir")));
  assert.ok(names.includes("alias.mov"));
});

test("resolveFileDownload serves real files with the right type and disposition", (t) => {
  const { home, debug } = makeHome(t);
  const mov = resolveFileDownload("skip-hero-debug", "render.debug.mov", home);
  assert.deepEqual(
    { type: mov.type, size: mov.size, inline: mov.inline, filename: mov.filename },
    { type: "video/quicktime", size: 128, inline: true, filename: "render.debug.mov" }
  );
  assert.equal(mov.path, fs.realpathSync(path.join(debug, "render.debug.mov")));
  const png = resolveFileDownload("skip-hero-debug", "pose/frame-1.png", home);
  assert.deepEqual({ type: png.type, inline: png.inline }, { type: "image/png", inline: true });
  const encoded = resolveFileDownload("skip-hero-debug", "pose%2Fframe-1.png", home);
  assert.equal(encoded.inline, true); // encoded separator decodes to the same file
  const json = resolveFileDownload("skip-hero-examples", "run.golden.json", home);
  assert.deepEqual({ type: json.type, inline: json.inline }, { type: "application/json", inline: false });
  const md = resolveFileDownload("skip-hero-documents", "decisions/0001-adr.md", home);
  assert.deepEqual(
    { type: md.type, inline: md.inline, filename: md.filename },
    { type: "text/markdown; charset=utf-8", inline: false, filename: "0001-adr.md" }
  );
  const research = resolveFileDownload("app-factory-docs", "marketing/platforms/tiktok/algorithm.md", home);
  assert.deepEqual(
    { type: research.type, inline: research.inline, filename: research.filename },
    { type: "text/markdown; charset=utf-8", inline: false, filename: "algorithm.md" }
  );
});

test("resolveFileDownload rejects traversal, encoded traversal, and absolute paths", (t) => {
  const { home } = makeHome(t);
  fs.writeFileSync(path.join(home, "src", "skip-hero", "loot.txt"), "secret");
  for (const rel of [
    "../loot.txt",
    "pose/../../loot.txt",
    "%2e%2e/loot.txt",
    "pose%2F..%2F..%2Floot.txt",
    "/etc/passwd",
    "//etc/passwd",
    "pose//frame-1.png",
    "..\\loot.txt",
    "bad\0.png",
  ]) {
    for (const key of ["skip-hero-debug", "skip-hero-documents", "app-factory-docs"]) {
      const r = resolveFileDownload(key, rel, home);
      assert.ok(r.error, `expected rejection for ${key} ${JSON.stringify(rel)}`);
      assert.ok([400, 403, 404].includes(r.status), `unexpected status for ${key} ${JSON.stringify(rel)}`);
      assert.equal(r.path, undefined);
    }
  }
});

test("resolveFileDownload rejects symlink escapes with realpath containment", (t) => {
  const { home, debug } = makeHome(t);
  const outside = path.join(home, "outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "secret.png"), "x");
  fs.symlinkSync(path.join(outside, "secret.png"), path.join(debug, "escape.png"));
  fs.symlinkSync(outside, path.join(debug, "escape-dir"));
  const direct = resolveFileDownload("skip-hero-debug", "escape.png", home);
  assert.deepEqual({ status: direct.status, path: direct.path }, { status: 403, path: undefined });
  const viaDir = resolveFileDownload("skip-hero-debug", "escape-dir/secret.png", home);
  assert.deepEqual({ status: viaDir.status, path: viaDir.path }, { status: 403, path: undefined });
  // An inside-the-root symlink still resolves.
  fs.symlinkSync(path.join(debug, "render.debug.mov"), path.join(debug, "alias.mov"));
  assert.equal(resolveFileDownload("skip-hero-debug", "alias.mov", home).inline, true);
});

test("resolveFileDownload contains the documents root exactly like the others", (t) => {
  const { home, documents } = makeHome(t);
  const outside = path.join(home, "outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "secret.md"), "x");
  fs.symlinkSync(path.join(outside, "secret.md"), path.join(documents, "escape.md"));
  const escaped = resolveFileDownload("skip-hero-documents", "escape.md", home);
  assert.deepEqual({ status: escaped.status, path: escaped.path }, { status: 403, path: undefined });
  // A sibling root's file is not reachable through the documents key.
  assert.equal(resolveFileDownload("skip-hero-documents", "render.debug.mov", home).status, 404);
});

test("resolveFileDownload contains the app-factory docs root exactly like the others", (t) => {
  const { home, factoryDocs } = makeHome(t);
  const outside = path.join(home, "outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "secret.md"), "x");
  fs.symlinkSync(path.join(outside, "secret.md"), path.join(factoryDocs, "escape.md"));
  const escaped = resolveFileDownload("app-factory-docs", "escape.md", home);
  assert.deepEqual({ status: escaped.status, path: escaped.path }, { status: 403, path: undefined });
  // A sibling root's file is not reachable through the docs key.
  assert.equal(resolveFileDownload("app-factory-docs", "render.debug.mov", home).status, 404);
});

test("resolveFileDownload accepts only declared root keys", (t) => {
  const { home } = makeHome(t);
  for (const key of ["etc", "/etc", "skip-hero", "skip-hero-debug2", "..", "%2e%2e", ""]) {
    const r = resolveFileDownload(key, "render.debug.mov", home);
    assert.deepEqual({ status: r.status, path: r.path }, { status: 404, path: undefined }, `key ${JSON.stringify(key)}`);
  }
});

test("resolveFileDownload maps a missing root or file to 404", (t) => {
  const { home, debug } = makeHome(t);
  assert.equal(resolveFileDownload("skip-hero-debug", "nope.mov", home).status, 404);
  fs.rmSync(debug, { recursive: true, force: true });
  assert.equal(resolveFileDownload("skip-hero-debug", "render.debug.mov", home).status, 404);
});
