import { useState } from "react";
import { api, setToken, clearToken } from "../api";

/** One-time login screen: paste the token printed by factory-web on first launch. */
export function TokenGate({ onAuthed }: { onAuthed: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = value.trim();
    if (!token) return;
    setBusy(true);
    setError(null);
    setToken(token);
    try {
      await api.health();
      onAuthed();
    } catch {
      clearToken();
      setError("That token was rejected. Copy FACTORY_WEB_TOKEN from the factory-web launch output (orchestration/web/.token).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="token-gate">
      <form onSubmit={submit} className="token-card">
        <h1>Factory Console</h1>
        <p>Paste the console token. It was printed once when factory-web first launched and lives in orchestration/web/.token on the factory machine.</p>
        <input
          type="password"
          inputMode="text"
          autoComplete="off"
          placeholder="FACTORY_WEB_TOKEN"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        {error && <div className="error-box">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy || !value.trim()}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
