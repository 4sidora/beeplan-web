const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem("beeplan_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("beeplan_token", token);
  else localStorage.removeItem("beeplan_token");
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Apiary = { id: number; name: string };
export type Colony = { id: number; apiary_id: number; name: string };
export type TelemetryPoint = { ts: string; metric: string; value: unknown };

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<{ id: number; email: string }>("/v1/me"),
  apiaries: () => apiFetch<Apiary[]>("/v1/apiaries"),
  colonies: (apiaryId: number) =>
    apiFetch<Colony[]>(`/v1/colonies?apiary_id=${encodeURIComponent(String(apiaryId))}`),
  telemetry: (colonyId: number, metric?: string) => {
    const q = metric ? `&metric=${encodeURIComponent(metric)}` : "";
    return apiFetch<TelemetryPoint[]>(
      `/v1/colonies/${encodeURIComponent(String(colonyId))}/telemetry?limit=500${q}`,
    );
  },
};
