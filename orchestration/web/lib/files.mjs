/*
 * File browsing for the factory web console's Files page: list and serve
 * skip-hero debug artifacts (renders, preview clips, pose JSON) from a fixed
 * allowlist of directories. FILE_ROOTS is the entire browsable surface —
 * adding a directory means adding one table entry here, never widening the
 * resolver. Containment is two-layer: decoded path segments are rejected up
 * front if suspicious, then the resolved file's realpath must stay inside the
 * root's realpath (this is what defeats symlink escapes). Read-only: nothing
 * here mutates the filesystem.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** The only browsable directories. key is the URL root segment; path is
 *  `~`-relative so the table works on any factory host checkout. */
export const FILE_ROOTS = [
  { key: "skip-hero-examples", label: "skip-hero examples", path: "~/src/skip-hero/examples" },
  { key: "skip-hero-debug", label: "skip-hero debug", path: "~/src/skip-hero/debug" },
  { key: "skip-hero-documents", label: "skip-hero documents", path: "~/src/skip-hero/documents" },
  { key: "app-factory-docs", label: "app-factory docs & research", path: "~/src/app-factory/docs" },
];

const MAX_DEPTH = 8;
const MAX_ENTRIES = 2000;

/** Media served inline (browser plays/renders); everything else downloads. */
const INLINE_TYPES = {
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};
const ATTACHMENT_TYPES = {
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function expandHome(p, home) {
  return p.startsWith("~") ? path.join(home, p.slice(1)) : p;
}

/** Realpath of a root's expanded directory, or null when it doesn't resolve
 *  to a directory (missing root on a fresh checkout is normal, not an error). */
function rootRealpath(root, home) {
  try {
    const real = fs.realpathSync(expandHome(root.path, home));
    return fs.statSync(real).isDirectory() ? real : null;
  } catch {
    return null;
  }
}

/** True when `real` is strictly inside directory `rootReal`. */
function insideRoot(real, rootReal) {
  return real.startsWith(rootReal + path.sep);
}

/**
 * Recursive bounded walk of one root: depth-capped, entry-capped, symlinked
 * directories never followed, symlinked files kept only when their realpath
 * stays inside the root. Mutates `out` ({ files, truncated }).
 */
function walkRoot(dir, rootReal, rel, depth, out) {
  if (depth < 0) {
    out.truncated = true;
    return;
  }
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (out.files.length >= MAX_ENTRIES) {
      out.truncated = true;
      return;
    }
    const p = path.join(dir, e.name);
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      walkRoot(p, rootReal, relPath, depth - 1, out);
    } else if (e.isFile() || e.isSymbolicLink()) {
      let real;
      try {
        real = fs.realpathSync(p);
      } catch {
        continue; // broken symlink or raced deletion
      }
      if (!insideRoot(real, rootReal)) continue; // symlink escape: silently skipped
      let st;
      try {
        st = fs.statSync(real);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      out.files.push({ path: relPath, bytes: st.size, mtime: st.mtime.toISOString() });
    }
  }
}

/**
 * Listing for every allowlisted root: files (relative path, bytes, mtime ISO)
 * sorted newest-first, per-root count and total bytes, `exists: false` with an
 * empty file list for a missing root — never a throw. `home` is injectable for
 * tests.
 */
export function listFileRoots(home = os.homedir()) {
  return FILE_ROOTS.map((root) => {
    const rootReal = rootRealpath(root, home);
    const out = { files: [], truncated: false };
    if (rootReal) walkRoot(rootReal, rootReal, "", MAX_DEPTH, out);
    out.files.sort((a, b) => (a.mtime < b.mtime ? 1 : a.mtime > b.mtime ? -1 : 0));
    return {
      key: root.key,
      label: root.label,
      path: root.path,
      exists: rootReal !== null,
      files: out.files,
      count: out.files.length,
      totalBytes: out.files.reduce((s, f) => s + f.bytes, 0),
      truncated: out.truncated,
    };
  });
}

/**
 * Resolve one download request to a servable file, or { status, error }.
 * `rootKey` must be a declared FILE_ROOTS key (anything else is 404 before any
 * filesystem access), `relPath` is the URL-encoded relative path. Decoded
 * segments are rejected when empty, `..`, or NUL-bearing; the resolved file's
 * realpath must stay inside the root's realpath. Returns
 * { path, type, size, inline, filename } on success.
 */
export function resolveFileDownload(rootKey, relPath, home = os.homedir()) {
  let key, decoded;
  try {
    key = decodeURIComponent(String(rootKey));
    decoded = decodeURIComponent(String(relPath));
  } catch {
    return { status: 400, error: "malformed path encoding" };
  }
  const root = FILE_ROOTS.find((r) => r.key === key);
  if (!root) return { status: 404, error: "no such file root" };
  if (decoded.includes("\0")) return { status: 400, error: "invalid path" };
  const segments = decoded.split("/");
  if (segments.some((s) => s === "" || s.split(/[\\/]/).includes(".."))) {
    return { status: 400, error: "invalid path" };
  }
  const rootReal = rootRealpath(root, home);
  if (!rootReal) return { status: 404, error: "no such file" };
  const resolved = path.resolve(rootReal, segments.join(path.sep));
  if (!insideRoot(resolved, rootReal)) return { status: 404, error: "no such file" };
  let real;
  try {
    real = fs.realpathSync(resolved);
  } catch {
    return { status: 404, error: "no such file" };
  }
  if (!insideRoot(real, rootReal)) return { status: 403, error: "forbidden" }; // symlink escape
  let st;
  try {
    st = fs.statSync(real);
  } catch {
    return { status: 404, error: "no such file" };
  }
  if (!st.isFile()) return { status: 404, error: "no such file" };
  const ext = path.extname(decoded).toLowerCase();
  const inlineType = INLINE_TYPES[ext];
  return {
    path: real,
    type: inlineType || ATTACHMENT_TYPES[ext] || "application/octet-stream",
    size: st.size,
    inline: Boolean(inlineType),
    filename: path.basename(decoded),
  };
}
