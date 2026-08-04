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
  settings: () => request<import("./types").SettingsResponse>("/api/settings"),
  usage: () => request<import("./types").UsageResponse>("/api/usage"),
  start: (body: { rig: string; workflow: string; prompt: string; auto: boolean }) =>
    post<{ ok: boolean; runId: string }>("/api/runs", body),
  approve: (id: string) => post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/approve`, {}),
  reject: (id: string, feedback: string) =>
    post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/reject`, { feedback }),
  steer: (id: string, instruction: string) =>
    post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/steer`, { instruction }),
  cancel: (id: string) => post<{ ok: boolean }>(`/api/runs/${encodeURIComponent(id)}/cancel`, {}),
};
