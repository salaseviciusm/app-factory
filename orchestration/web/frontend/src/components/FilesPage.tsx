import { useEffect, useState } from "react";
import { api } from "../api";
import type { FileEntry, FileRootListing } from "../types";
import { usePolling } from "../hooks/usePolling";
import { fmtBytes, fmtWhen } from "../format";

const VIDEO_EXTS = [".mov", ".mp4"];
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

type MediaKind = "video" | "image" | null;

function mediaKind(name: string): MediaKind {
  const lower = name.toLowerCase();
  if (VIDEO_EXTS.some((e) => lower.endsWith(e))) return "video";
  if (IMAGE_EXTS.some((e) => lower.endsWith(e))) return "image";
  return null;
}

interface PreviewTarget {
  rootKey: string;
  path: string;
  kind: Exclude<MediaKind, null>;
}

/** Browse the allowlisted skip-hero debug directories: files grouped by root,
 *  newest-first. Videos and images open inline (blob object-URL — an <a href>
 *  can't carry the token); everything else downloads. Strictly read-only. */
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
    <section className="panel">
      <h3>{root.label}</h3>
      <div className="file-root-meta">
        <code>{root.path}</code> · {root.count} file(s) · {fmtBytes(root.totalBytes)}
      </div>
      {root.truncated && (
        <div className="notice-box">Listing truncated — showing the newest {root.count} entries.</div>
      )}
      {!root.exists ? (
        <div className="empty-state">Directory does not exist on the factory host.</div>
      ) : root.files.length === 0 ? (
        <div className="empty-state">No files in this directory.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>file</th>
                <th>size</th>
                <th>modified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {root.files.map((f) => (
                <tr key={f.path}>
                  <td>
                    <button className="file-link" onClick={() => onOpen(f)}>
                      {mediaKind(f.path) === "video" ? "🎞 " : mediaKind(f.path) === "image" ? "🖼 " : "📄 "}
                      {f.path}
                    </button>
                  </td>
                  <td>{fmtBytes(f.bytes)}</td>
                  <td>{fmtWhen(f.mtime)}</td>
                  <td>
                    <button
                      className="btn btn-ghost file-dl-btn"
                      title="Download"
                      disabled={busyPath === `${root.key}/${f.path}`}
                      onClick={() => onDownload(f)}
                    >
                      ⬇
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Inline media preview: auth-fetch the blob, object-URL it into a <video> or
 *  <img>. No range support — large videos fully download before playing. */
function FilePreview({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let obj: string | null = null;
    let cancelled = false;
    setUrl(null);
    setError(null);
    api
      .fileBlob(target.rootKey, target.path)
      .then((blob) => {
        if (cancelled) return;
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [target.rootKey, target.path]);

  return (
    <section className="panel file-preview">
      <div className="file-preview-head">
        <h3>{target.path}</h3>
        <button className="btn btn-ghost" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      {error && <div className="error-box">preview failed to load: {error}</div>}
      {!url && !error && <div className="empty-state">Loading {target.kind}… (full file downloads before playing)</div>}
      {url && target.kind === "video" && <video className="file-preview-media" src={url} controls autoPlay playsInline />}
      {url && target.kind === "image" && <img className="file-preview-media" src={url} alt={target.path} />}
    </section>
  );
}
