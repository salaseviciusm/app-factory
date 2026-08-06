import { useEffect, useState } from "react";
import { api } from "../api";
import type { FileEntry, FileRootListing } from "../types";
import { usePolling } from "../hooks/usePolling";
import { fmtBytes, fmtWhen } from "../format";

const VIDEO_EXTS = [".mov", ".mp4"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const TEXT_EXTS = [".md", ".txt", ".json"];

type MediaKind = "video" | "image" | "text" | null;

function mediaKind(name: string): MediaKind {
  const lower = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return "video";
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return "image";
  if (TEXT_EXTS.some((e) => lower.endsWith(e))) return "text";
  return null;
}

interface PreviewTarget {
  rootKey: string;
  path: string;
  kind: Exclude<MediaKind, null>;
}

/** Browse the allowlisted directories: each root is a collapsed-by-default
 *  panel whose files are grouped into a collapsible folder tree (folders A-Z,
 *  files newest-first). Videos, images, and text docs open inline (blob
 *  fetch — an <a href> can't carry the token); everything else downloads.
 *  Strictly read-only. */
export function FilesPage() {
  // Listings are cheap stat walks; refresh every 30 s (paused while hidden).
  const { data, error, loading, refresh } = usePolling(() => api.files(), 30000);
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const download = async (rootKey: string, entry: FileEntry) => {
    setBusyPath(`${rootKey}/${entry.path}`);
    setActionError(null);
    try {
      const blob = await api.fileBlob(rootKey, entry.path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.path.split("/").pop() ?? entry.path;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyPath(null);
    }
  };

  const open = (rootKey: string, entry: FileEntry) => {
    const kind = mediaKind(entry.path);
    if (kind) {
      setActionError(null);
      setPreview({ rootKey, path: entry.path, kind });
    } else {
      void download(rootKey, entry);
    }
  };

  if (loading && !data) return <div className="empty-state">Loading files…</div>;
  if (error && !data) return <div className="error-box">Failed to load files: {error}</div>;
  if (!data) return null;

  return (
    <div className="files-page">
      <div className="files-toolbar">
        <button className="btn btn-ghost" onClick={() => void refresh()}>
          ⟳ Refresh
        </button>
        {error && <div className="error-box">refresh failed: {error}</div>}
        {actionError && <div className="error-box">{actionError}</div>}
      </div>
      {preview && <FilePreview target={preview} onClose={() => setPreview(null)} />}
      {data.roots.map((root) => (
        <RootPanel
          key={root.key}
          root={root}
          busyPath={busyPath}
          onOpen={(entry) => open(root.key, entry)}
          onDownload={(entry) => void download(root.key, entry)}
        />
      ))}
    </div>
  );
}

/** Directory tree built client-side from the `/`-separated entry paths.
 *  Files stay in the backend's newest-first order; folders render A-Z. */
interface DirNode {
  dirs: Map<string, DirNode>;
  files: FileEntry[];
  fileCount: number; // recursive
}

function buildTree(files: FileEntry[]): DirNode {
  const root: DirNode = { dirs: new Map(), files: [], fileCount: files.length };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    for (const part of parts.slice(0, -1)) {
      let child = node.dirs.get(part);
      if (!child) {
        child = { dirs: new Map(), files: [], fileCount: 0 };
        node.dirs.set(part, child);
      }
      node = child;
      node.fileCount++;
    }
    node.files.push(f);
  }
  return root;
}

function RootPanel({
  root,
  busyPath,
  onOpen,
  onDownload,
}: {
  root: FileRootListing;
  busyPath: string | null;
  onOpen: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
}) {
  return (
    <details className="panel file-root">
      <summary className="file-root-summary">
        <h3>{root.label}</h3>
        <span className="file-root-meta">
          <code>{root.path}</code> · {root.count} file(s) · {fmtBytes(root.totalBytes)}
        </span>
      </summary>
      {root.truncated && (
        <div className="notice-box">Listing truncated — showing the newest {root.count} entries.</div>
      )}
      {!root.exists ? (
        <div className="empty-state">Directory does not exist on the factory host.</div>
      ) : root.files.length === 0 ? (
        <div className="empty-state">No files in this directory.</div>
      ) : (
        <div className="file-tree">
          <TreeLevel
            node={buildTree(root.files)}
            rootKey={root.key}
            busyPath={busyPath}
            onOpen={onOpen}
            onDownload={onDownload}
          />
        </div>
      )}
    </details>
  );
}

function TreeLevel({
  node,
  rootKey,
  busyPath,
  onOpen,
  onDownload,
}: {
  node: DirNode;
  rootKey: string;
  busyPath: string | null;
  onOpen: (entry: FileEntry) => void;
  onDownload: (entry: FileEntry) => void;
}) {
  const folders = [...node.dirs.keys()].sort();
  return (
    <>
      {folders.map((name) => {
        const child = node.dirs.get(name)!;
        return (
          <details className="file-folder" key={name}>
            <summary>
              📁 {name} <span className="file-folder-count">{child.fileCount} file(s)</span>
            </summary>
            <TreeLevel
              node={child}
              rootKey={rootKey}
              busyPath={busyPath}
              onOpen={onOpen}
              onDownload={onDownload}
            />
          </details>
        );
      })}
      {node.files.map((f) => (
        <div className="file-row" key={f.path}>
          <button className="file-link" onClick={() => onOpen(f)}>
            {mediaKind(f.path) === "video" ? "🎞 " : mediaKind(f.path) === "image" ? "🖼 " : "📄 "}
            {f.path.split("/").pop() ?? f.path}
          </button>
          <span className="file-row-meta">{fmtBytes(f.bytes)}</span>
          <span className="file-row-meta">{fmtWhen(f.mtime)}</span>
          <button
            className="btn btn-ghost file-dl-btn"
            title="Download"
            disabled={busyPath === `${rootKey}/${f.path}`}
            onClick={() => onDownload(f)}
          >
            ⬇
          </button>
        </div>
      ))}
    </>
  );
}

/** Inline preview: auth-fetch the blob, then object-URL it into a <video> or
 *  <img>, or read it as text into a <pre>. No range support — large videos
 *  fully download before playing. */
function FilePreview({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let obj: string | null = null;
    let cancelled = false;
    setUrl(null);
    setText(null);
    setError(null);
    api
      .fileBlob(target.rootKey, target.path)
      .then(async (blob) => {
        if (cancelled) return;
        if (target.kind === "text") {
          const body = await blob.text();
          if (!cancelled) setText(body);
        } else {
          obj = URL.createObjectURL(blob);
          setUrl(obj);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [target.rootKey, target.path, target.kind]);

  return (
    <section className="panel file-preview">
      <div className="file-preview-head">
        <h3>{target.path}</h3>
        <button className="btn btn-ghost" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      {error && <div className="error-box">preview failed to load: {error}</div>}
      {!url && text === null && !error && <div className="empty-state">Loading {target.kind}…</div>}
      {url && target.kind === "video" && <video className="file-preview-media" src={url} controls autoPlay playsInline />}
      {url && target.kind === "image" && <img className="file-preview-media" src={url} alt={target.path} />}
      {text !== null && target.kind === "text" && <pre className="doc-view">{text}</pre>}
    </section>
  );
}
