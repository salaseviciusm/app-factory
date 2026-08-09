const TOKEN_KEY = "factoryWebToken";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Fired when a request comes back 401 so the app can drop to the token gate. */
export const AUTH_EVENT = "factory-auth-required";

async function request<T>(path: string, init?: RequestInit & { asText?: boolean }): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    window.dispatchEvent(new Event(AUTH_EVENT));
    throw new ApiError(401, "invalid token");
  }
  if (init?.asText) {
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return (await res.text()) as unknown as T;
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

export const api = {
  health: () => request<{ ok: boolean }>("/api/health"),
  runs: () => request<import("./types").RunsResponse>("/api/runs"),
  run: (id: string) => request<import("./types").RunDetail>(`/api/runs/${encodeURIComponent(id)}`),
  log: (id: string, name: string) =>
    request<string>(`/api/runs/${encodeURIComponent(id)}/log/${encodeURIComponent(name)}`, { asText: true }),
  stepDoc: (id: string, stepId: string, kind: import("./types").StepDocKind, attempt?: number) =>
    request<string>(
      `/api/runs/${encodeURIComponent(id)}/step/${encodeURIComponent(stepId)}/${encodeURIComponent(kind)}` +
        (attempt != null ? `?attempt=${attempt}` : ""),
      { asText: true }
    ),
  /** Check-gate artifact (timeline image, report JSON, debug video) as a
   *  Blob — fetched with the auth header (an <img src>/<a href> can't carry
   *  it), then object-URL'd by the caller. */
  gateArtifact: async (id: string, name: string): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`/api/runs/${encodeURIComponent(id)}/gate/${encodeURIComponent(name)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event(AUTH_EVENT));
      throw new ApiError(401, "invalid token");
    }
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.blob();
  },
  files: () => request<import("./types").FilesResponse>("/api/files"),
  /** One allowlisted debug-artifact file as a Blob — fetched with the auth
   *  header (a <video src>/<a href> can't carry it), then object-URL'd by the
   *  caller. Path segments are encoded individually so nested paths survive. */
  fileBlob: async (rootKey: string, relPath: string): Promise<Blob> => {
    const token = getToken();
    const encodedPath = relPath.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`/api/files/${encodeURIComponent(rootKey)}/${encodedPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event(AUTH_EVENT));
      throw new ApiError(401, "invalid token");
    }
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.blob();
  },
  settings: () => request<import("./types").SettingsResponse>("/api/settings"),
  usage: () => request<import("./types").UsageResponse>("/api/usage"),
  start: (body: { rig: string; workflow: string; prompt: string; auto: boolean; preview?: boolean }) =>
    post<{ ok: boolean; runId: string }>("/api/runs", body),
  approve: (id: string) => post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/approve`, {}),
  reject: (id: string, feedback: string) =>
    post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/reject`, { feedback }),
  steer: (id: string, instruction: string) =>
    post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/steer`, { instruction }),
  reply: (id: string, text: string) => post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/reply`, { text }),
  cancel: (id: string) => post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/cancel`, {}),
  retry: (id: string, force = false) =>
    post<{ ok: boolean; tier: "resume" | "triage"; message: string }>(
      `/api/runs/${encodeURIComponent(id)}/retry`,
      { force }
    ),
  resume: (id: string) => post<{ ok: boolean; message?: string }>(`/api/runs/${encodeURIComponent(id)}/resume`, {}),
  /** Refresh an awaiting-merge run's PR from GitHub (merged → done, closed → closed). */
  sync: (id: string) => post<{ ok: boolean; message?: string }>(`/api/runs/${encodeURIComponent(id)}/sync`, {}),
  /** Chained follow-up run continuing the parent's branch (one PR per chain). */
  followup: (id: string, workflow: "feature-dev" | "bug-fix", prompt: string) =>
    post<{ ok: boolean; runId: string }>(`/api/runs/${encodeURIComponent(id)}/followup`, { workflow, prompt }),
  discard: (id: string) => post<{ ok: boolean; message?: string }>(`/api/runs/${encodeURIComponent(id)}/discard`, {}),
  preview: (id: string, kind?: "build" | "update") =>
    post<{ ok: boolean; message: string }>(`/api/runs/${encodeURIComponent(id)}/preview`, kind ? { kind } : {}),
  previewMode: (id: string, mode: "on" | "off") =>
    post<{ ok: boolean; message: string }>(`/api/runs/${encodeURIComponent(id)}/preview-mode`, { mode }),
  deploy: (id: string) => post<{ ok: boolean; message: string }>(`/api/runs/${encodeURIComponent(id)}/deploy`, {}),
  /** Whitelisted run-dir image (the QR codes) as an object URL — <img src>
   *  cannot carry the bearer token, so fetch the bytes and hand back a blob. */
  artifactUrl: async (id: string, name: "qr.png" | "preview-qr.png"): Promise<string> => {
    const token = getToken();
    const res = await fetch(`/api/runs/${encodeURIComponent(id)}/artifact/${name}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event(AUTH_EVENT));
      throw new ApiError(401, "invalid token");
    }
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
    return URL.createObjectURL(await res.blob());
  },
};
