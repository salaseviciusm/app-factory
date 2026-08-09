/* Tests for github.mjs — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  githubWebUrl,
  parsePrCreateUrl,
  parsePrList,
  parsePrStatus,
  prCreateCommand,
  prListCommand,
  prStatusCommand,
  repoUrlForRig,
  rigCheckoutPath,
} from "./github.mjs";

test("githubWebUrl normalizes GitHub remotes", () => {
  assert.equal(
    githubWebUrl("git@github.com:salaseviciusm/app-factory.git"),
    "https://github.com/salaseviciusm/app-factory"
  );
  assert.equal(githubWebUrl("ssh://git@github.com/owner/repo.git"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo.git"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo"), "https://github.com/owner/repo");
  assert.equal(githubWebUrl("https://github.com/owner/repo/\n"), "https://github.com/owner/repo");
});

test("githubWebUrl rejects non-GitHub or malformed remotes", () => {
  assert.equal(githubWebUrl("git@gitlab.com:owner/repo.git"), null);
  assert.equal(githubWebUrl("https://example.com/owner/repo"), null);
  assert.equal(githubWebUrl("/local/bare/repo.git"), null);
  assert.equal(githubWebUrl(""), null);
  assert.equal(githubWebUrl(undefined), null);
});

test("rigCheckoutPath resolves rigs.json entries and factory:<app> rigs", (t) => {
  const orchDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-test-"));
  t.after(() => fs.rmSync(orchDir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(orchDir, "rigs.json"),
    JSON.stringify({
      rigs: { "some-rig": { path: "/srv/some-rig" } },
      factoryApps: { basePath: "/srv/apps" },
    })
  );
  assert.equal(rigCheckoutPath(orchDir, "some-rig"), "/srv/some-rig");
  assert.equal(rigCheckoutPath(orchDir, "factory:my-app"), path.join("/srv/apps", "my-app"));
  assert.equal(rigCheckoutPath(orchDir, "unknown-rig"), null);
  assert.equal(rigCheckoutPath(orchDir, null), null);
});

test("repoUrlForRig reads the origin remote of a real checkout, null otherwise", (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gh-test-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const repoDir = path.join(tmp, "checkout");
  fs.mkdirSync(repoDir);
  execFileSync("git", ["-C", repoDir, "init", "-q"]);
  execFileSync("git", ["-C", repoDir, "remote", "add", "origin", "git@github.com:owner/repo.git"]);
  const orchDir = path.join(tmp, "orch");
  fs.mkdirSync(orchDir);
  fs.writeFileSync(
    path.join(orchDir, "rigs.json"),
    JSON.stringify({ rigs: { good: { path: repoDir }, gone: { path: path.join(tmp, "missing") } } })
  );
  assert.equal(repoUrlForRig(orchDir, "good"), "https://github.com/owner/repo");
  assert.equal(repoUrlForRig(orchDir, "gone"), null);
  assert.equal(repoUrlForRig(orchDir, "never-registered"), null);
});

test("pr command builders emit the exact gh argv", () => {
  assert.deepEqual(prListCommand("factory/feature-x"), [
    "pr", "list", "--head", "factory/feature-x", "--state", "open", "--json", "number,url",
  ]);
  assert.deepEqual(prCreateCommand({ branch: "factory/feature-x", base: "main", title: "T", body: "B" }), [
    "pr", "create", "--head", "factory/feature-x", "--base", "main", "--title", "T", "--body", "B",
  ]);
  assert.deepEqual(prStatusCommand(12), ["pr", "view", "12", "--json", "state,mergedAt,mergeCommit"]);
});

test("parsePrList keeps well-formed open PRs and degrades garbage to []", () => {
  assert.deepEqual(parsePrList([{ number: 7, url: "https://github.com/o/r/pull/7" }]), [
    { number: 7, url: "https://github.com/o/r/pull/7" },
  ]);
  assert.deepEqual(parsePrList([{ number: "7" }, null, { url: "x" }, { number: 8, url: "https://github.com/o/r/pull/8" }]), [
    { number: 8, url: "https://github.com/o/r/pull/8" },
  ]);
  assert.deepEqual(parsePrList(null), []);
  assert.deepEqual(parsePrList({ number: 7 }), []);
});

test("parsePrCreateUrl extracts the PR number/url from gh pr create output", () => {
  assert.deepEqual(parsePrCreateUrl("Creating pull request for factory/x into main\nhttps://github.com/o/r/pull/42\n"), {
    number: 42,
    url: "https://github.com/o/r/pull/42",
  });
  assert.equal(parsePrCreateUrl("no url here"), null);
  assert.equal(parsePrCreateUrl(""), null);
});

test("parsePrStatus normalizes gh pr view JSON to open/merged/closed", () => {
  assert.deepEqual(
    parsePrStatus({ state: "MERGED", mergedAt: "2026-08-09T10:00:00Z", mergeCommit: { oid: "abc123def456" } }),
    { state: "merged", mergedAt: "2026-08-09T10:00:00Z", mergeCommit: "abc123def456" }
  );
  assert.deepEqual(parsePrStatus({ state: "OPEN", mergedAt: null, mergeCommit: null }), {
    state: "open",
    mergedAt: null,
    mergeCommit: null,
  });
  assert.deepEqual(parsePrStatus({ state: "CLOSED" }), { state: "closed", mergedAt: null, mergeCommit: null });
  assert.equal(parsePrStatus({ state: "DRAFT?" }), null);
  assert.equal(parsePrStatus(null), null);
  assert.equal(parsePrStatus("MERGED"), null);
});
