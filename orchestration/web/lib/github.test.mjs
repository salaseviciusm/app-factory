/* Tests for github.mjs — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { githubWebUrl, rigCheckoutPath, repoUrlForRig } from "./github.mjs";

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
