import { useCallback, useEffect, useState } from "react";
import { api, AUTH_EVENT, clearToken, getToken } from "./api";
import { usePolling } from "./hooks/usePolling";
import { TokenGate } from "./components/TokenGate";
import { RunList } from "./components/RunList";
import { RunDetail } from "./components/RunDetail";
import { NewRun } from "./components/NewRun";
import { Settings } from "./components/Settings";
import { Usage } from "./components/Usage";

type Route = { page: "runs"; runId: string | null } | { page: "new" } | { page: "usage" } | { page: "settings" };

function parseHash(hash: string): Route {
  const m = /^#\/run\/([a-z0-9-]+)$/.exec(hash);
  if (m) return { page: "runs", runId: m[1] };
  if (hash === "#/new") return { page: "new" };
  if (hash === "#/usage") return { page: "usage" };
  if (hash === "#/settings") return { page: "settings" };
  return { page: "runs", runId: null };
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const route = useHashRoute();

  useEffect(() => {
    const onAuthRequired = () => {
      clearToken();
      setAuthed(false);
    };
    window.addEventListener(AUTH_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_EVENT, onAuthRequired);
  }, []);

  if (!authed) return <TokenGate onAuthed={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark">⚙</span> <span className="brand-text">Factory Console</span>
        </a>
        <nav>
          <a className={route.page === "runs" ? "nav-active" : ""} href="#/">
            Runs
          </a>
          <a className={route.page === "new" ? "nav-active" : ""} href="#/new">
            New run
          </a>
          <a className={route.page === "usage" ? "nav-active" : ""} href="#/usage">
            Usage
          </a>
          <a className={route.page === "settings" ? "nav-active" : ""} href="#/settings">
            Settings
          </a>
        </nav>
        <button
          className="btn btn-ghost lock-btn"
          title="Forget the token on this device"
          onClick={() => {
            clearToken();
            setAuthed(false);
          }}
        >
          Lock
        </button>
      </header>
      <main className="content">
        {route.page === "runs" && <RunsPage selectedId={route.runId} />}
        {route.page === "new" && <NewRun onStarted={(id) => (window.location.hash = `#/run/${id}`)} />}
        {route.page === "usage" && <Usage />}
        {route.page === "settings" && <Settings />}
      </main>
    </div>
  );
}

function RunsPage({ selectedId }: { selectedId: string | null }) {
  // Run list refreshes at most every 10 s (paused entirely while hidden).
  const { data, error, loading } = usePolling(() => api.runs(), 10000);
  const select = useCallback((id: string) => {
    window.location.hash = `#/run/${id}`;
  }, []);

  return (
    <div className={`runs-page ${selectedId ? "has-selection" : ""}`}>
      <aside className="runs-pane">
        {error && !data && <div className="error-box">Failed to load runs: {error}</div>}
        {loading && !data && <div className="empty-state">Loading runs…</div>}
        {data && <RunList runs={data.runs} selectedId={selectedId} onSelect={select} />}
      </aside>
      <section className="detail-pane">
        {selectedId ? (
          <RunDetail runId={selectedId} onBack={() => (window.location.hash = "#/")} />
        ) : (
          <div className="empty-state detail-placeholder">Select a run to inspect its pipeline.</div>
        )}
      </section>
    </div>
  );
}
