import { formatBatterySummary } from "./battery";

export function formatTelemetryValue(metric: string, value: unknown): string {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.celsius === "number") return `${v.celsius} °C`;
    if (metric === "battery_voltage" && typeof v.volts === "number") {
      return formatBatterySummary(v.volts);
    }
    if (typeof v.volts === "number") return `${v.volts.toFixed(2)} V`;
    if (metric === "battery_percent" && typeof v.percent === "number") {
      return `${Math.round(v.percent)} %`;
    }
    if (typeof v.percent === "number") {
      if (metric === "relative_humidity") return `${v.percent} %`;
      return `${Math.round(v.percent)} %`;
    }
    if (typeof v.dbm === "number") return `${v.dbm} dBm`;
    if (typeof v.version === "string") return v.version;
    if (v.v != null) return String(v.v);
  }
  if (typeof value === "number" || typeof value === "string") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
