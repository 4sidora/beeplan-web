export function formatTelemetryValue(metric: string, value: unknown): string {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.celsius === "number") return `${v.celsius} °C`;
    if (typeof v.percent === "number") return `${v.percent} %`;
    if (v.v != null) return String(v.v);
  }
  if (typeof value === "number" || typeof value === "string") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
