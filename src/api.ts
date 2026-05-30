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
export type Colony = {
  id: number;
  apiary_id: number;
  name: string;
  bee_breed: string | null;
  description: string | null;
  colony_type: string | null;
  hive_type: string | null;
  body_count: number | null;
  frames_per_body: number | null;
  hive_volume_m3: number | null;
};

export type ColonyPayload = {
  name: string;
  bee_breed?: string | null;
  description?: string | null;
  colony_type?: string | null;
  hive_type?: string | null;
  body_count?: number | null;
  frames_per_body?: number | null;
  hive_volume_m3?: number | null;
};
export type BeeBreed = { id: number; name: string };
export type Concentrator = { id: number; apiary_id: number; name: string; ingest_token: string };
export type EdgeDevice = {
  id: number;
  concentrator_id: number;
  concentrator_name: string | null;
  public_id: string;
  label: string | null;
  current_colony_id: number | null;
};
export type TelemetryPoint = { ts: string; metric: string; value: unknown };

export type TelemetryParams = {
  metric?: string;
  limit?: number;
  from?: string;
  to?: string;
};

function telemetryQuery(params?: TelemetryParams): string {
  const q = new URLSearchParams();
  if (params?.metric) q.set("metric", params.metric);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<{ id: number; email: string }>("/v1/me"),

  beeBreeds: () => apiFetch<BeeBreed[]>("/v1/bee-breeds"),

  apiaries: () => apiFetch<Apiary[]>("/v1/apiaries"),
  createApiary: (name: string) =>
    apiFetch<Apiary>("/v1/apiaries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  updateApiary: (id: number, name: string) =>
    apiFetch<Apiary>(`/v1/apiaries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  deleteApiary: (id: number) =>
    apiFetch<void>(`/v1/apiaries/${id}`, { method: "DELETE" }),

  suggestedColonyName: () => apiFetch<{ name: string }>("/v1/colonies/suggested-name"),

  colonies: (apiaryId: number) =>
    apiFetch<Colony[]>(`/v1/colonies?apiary_id=${encodeURIComponent(String(apiaryId))}`),
  colony: (id: number) => apiFetch<Colony>(`/v1/colonies/${id}`),
  createColony: (apiaryId: number, body: ColonyPayload) =>
    apiFetch<Colony>("/v1/colonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiary_id: apiaryId, ...body }),
    }),
  updateColony: (id: number, body: ColonyPayload) =>
    apiFetch<Colony>(`/v1/colonies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteColony: (id: number) =>
    apiFetch<void>(`/v1/colonies/${id}`, { method: "DELETE" }),

  concentrators: (apiaryId: number) =>
    apiFetch<Concentrator[]>(
      `/v1/concentrators?apiary_id=${encodeURIComponent(String(apiaryId))}`,
    ),
  createConcentrator: (apiaryId: number, name: string) =>
    apiFetch<Concentrator>("/v1/concentrators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiary_id: apiaryId, name }),
    }),
  updateConcentrator: (id: number, name: string) =>
    apiFetch<Concentrator>(`/v1/concentrators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  deleteConcentrator: (id: number) =>
    apiFetch<void>(`/v1/concentrators/${id}`, { method: "DELETE" }),

  edgeDevices: (apiaryId: number) =>
    apiFetch<EdgeDevice[]>(
      `/v1/edge-devices?apiary_id=${encodeURIComponent(String(apiaryId))}`,
    ),
  createEdgeDevice: (body: {
    concentrator_id: number;
    public_id: string;
    label?: string | null;
    colony_id?: number | null;
  }) =>
    apiFetch<EdgeDevice>("/v1/edge-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateEdgeDevice: (id: number, body: { public_id?: string; label?: string | null }) =>
    apiFetch<EdgeDevice>(`/v1/edge-devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteEdgeDevice: (id: number) =>
    apiFetch<void>(`/v1/edge-devices/${id}`, { method: "DELETE" }),
  setDeviceColony: (deviceId: number, colonyId: number | null) =>
    apiFetch<EdgeDevice>(`/v1/edge-devices/${deviceId}/colony`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colony_id: colonyId }),
    }),

  telemetry: (colonyId: number, params?: TelemetryParams) =>
    apiFetch<TelemetryPoint[]>(
      `/v1/colonies/${encodeURIComponent(String(colonyId))}/telemetry${telemetryQuery(params)}`,
    ),
};
