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
  const text = await res.text();
  if (!res.ok) {
    let message = text || res.statusText;
    try {
      const parsed = JSON.parse(text) as { detail?: string | { msg?: string }[] };
      if (typeof parsed.detail === "string") message = parsed.detail;
      else if (Array.isArray(parsed.detail)) {
        message = parsed.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ");
      }
    } catch {
      /* keep raw text */
    }
    throw new Error(message);
  }
  if (res.status === 204 || res.status === 205 || !text) return undefined as T;
  return JSON.parse(text) as T;
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
export type Concentrator = {
  id: number;
  apiary_id: number;
  apiary_name?: string | null;
  name: string;
  ingest_token: string;
  gateway_mac: string | null;
  last_seen_at: string | null;
  firmware_version: string | null;
  edge_device_count?: number;
};
export type EdgeDevice = {
  id: number;
  concentrator_id: number;
  concentrator_name: string | null;
  public_id: string;
  name: string | null;
  current_colony_id: number | null;
  last_seen_at: string | null;
  firmware_version: string | null;
  recent_telemetry: TelemetryPoint[];
};
export type TelemetryPoint = { ts: string; metric: string; value: unknown };

/** Ответ API иногда приходит объектом вместо массива при одном элементе (клиенты/прокси). */
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function dedupeConcentrators(items: Concentrator[]): Concentrator[] {
  const byId = new Map<number, Concentrator>();
  for (const item of items) byId.set(item.id, item);
  return [...byId.values()];
}

/** Список базовых станций по всем пасекам пользователя. */
async function fetchAllConcentrators(): Promise<Concentrator[]> {
  try {
    const all = await apiFetch<Concentrator[] | Concentrator>("/v1/concentrators");
    const list = dedupeConcentrators(asArray(all));
    if (list.length > 0) return enrichConcentratorApiaryNames(list);
  } catch {
    /* старый API требует apiary_id — собираем по пасекам */
  }

  const apiaries = asArray(await apiFetch<Apiary[] | Apiary>("/v1/apiaries"));
  return fetchConcentratorsForApiaries(apiaries);
}

async function enrichConcentratorApiaryNames(items: Concentrator[]): Promise<Concentrator[]> {
  if (items.every((c) => c.apiary_name)) return items;
  const apiaries = asArray(await apiFetch<Apiary[] | Apiary>("/v1/apiaries"));
  const names = new Map(apiaries.map((a) => [a.id, a.name]));
  return items.map((c) => ({
    ...c,
    apiary_name: c.apiary_name ?? names.get(c.apiary_id) ?? null,
  }));
}

async function fetchConcentratorsForApiaries(apiaries: Apiary[]): Promise<Concentrator[]> {
  if (apiaries.length === 0) return [];
  const results = await Promise.allSettled(
    apiaries.map(async (a) => {
      const raw = await apiFetch<Concentrator[] | Concentrator>(
        `/v1/concentrators?apiary_id=${encodeURIComponent(String(a.id))}`,
      );
      return asArray(raw).map((c) => ({
        ...c,
        apiary_name: c.apiary_name ?? a.name,
      }));
    }),
  );
  const merged: Concentrator[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }
  return dedupeConcentrators(merged);
}

/** Устройства одной базовой станции. */
async function fetchEdgeDevicesByConcentrator(concentratorId: number): Promise<EdgeDevice[]> {
  try {
    const raw = await apiFetch<EdgeDevice[] | EdgeDevice>(
      `/v1/edge-devices?concentrator_id=${encodeURIComponent(String(concentratorId))}`,
    );
    return asArray(raw);
  } catch {
    const conc = await apiFetch<Concentrator>(`/v1/concentrators/${concentratorId}`);
    const raw = await apiFetch<EdgeDevice[] | EdgeDevice>(
      `/v1/edge-devices?apiary_id=${encodeURIComponent(String(conc.apiary_id))}`,
    );
    return asArray(raw).filter((d) => d.concentrator_id === concentratorId);
  }
}

export type FirmwareBuild = {
  id: string;
  device_type: string;
  board: string;
  concentrator_id: number;
  edge_device_id: number | null;
  status: string;
  error: string | null;
  manifest_url: string | null;
  firmware_version: string | null;
  serial_tag: string | null;
  expires_at: string;
  created_at: string;
  finished_at: string | null;
  phase?: string | null;
  log_tail?: string[] | null;
  progress_pct?: number | null;
  updated_at?: string | null;
};

export type FirmwareRelease = {
  firmware_version: string;
  gateway_version: string;
  edge_version: string;
  gateway_serial_tag: string;
  edge_serial_tag: string;
};

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
  suggestedBaseStationName: () =>
    apiFetch<{ name: string }>("/v1/concentrators/suggested-name"),

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
  allConcentrators: () => fetchAllConcentrators(),
  concentrator: (id: number) => apiFetch<Concentrator>(`/v1/concentrators/${id}`),
  createConcentrator: (apiaryId: number, name?: string | null) =>
    apiFetch<Concentrator>("/v1/concentrators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiary_id: apiaryId,
        name: name?.trim() || null,
      }),
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
  edgeDevicesByConcentrator: (concentratorId: number) =>
    fetchEdgeDevicesByConcentrator(concentratorId),
  edgeDevice: (id: number) => apiFetch<EdgeDevice>(`/v1/edge-devices/${id}`),
  edgeDeviceTelemetry: (deviceId: number, params?: TelemetryParams) =>
    apiFetch<TelemetryPoint[]>(
      `/v1/edge-devices/${encodeURIComponent(String(deviceId))}/telemetry${telemetryQuery(params)}`,
    ),
  createEdgeDevice: (body: {
    concentrator_id: number;
    name?: string | null;
    colony_id?: number | null;
  }) =>
    apiFetch<EdgeDevice>("/v1/edge-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateEdgeDevice: (id: number, body: { name?: string | null }) =>
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

  createFirmwareBuild: (body: {
    device_type: "gateway" | "edge";
    board?: string;
    concentrator_id: number;
    edge_device_id?: number | null;
    wifi_ssid?: string;
    wifi_password?: string;
    api_base_url?: string;
    wake_interval_sec?: number;
  }) =>
    apiFetch<FirmwareBuild>("/v1/firmware/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  firmwareBuild: (id: string) => apiFetch<FirmwareBuild>(`/v1/firmware/builds/${id}`),
  firmwareReleases: () => apiFetch<FirmwareRelease>("/v1/firmware/releases"),
};
