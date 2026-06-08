import type { TelemetryPoint } from "../api";

export type StatusLevel = "good" | "warn" | "bad";

export const STATUS_COLORS: Record<StatusLevel, string> = {
  good: "#2e7d32",
  warn: "#ed6c02",
  bad: "#d32f2f",
};

export function signalDbmFromValue(value: unknown): number | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const dbm = (value as Record<string, unknown>).dbm;
    if (typeof dbm === "number" && Number.isFinite(dbm)) return dbm;
  }
  return null;
}

export function batteryPercentFromValue(value: unknown): number | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const percent = (value as Record<string, unknown>).percent;
    if (typeof percent === "number" && Number.isFinite(percent)) return percent;
  }
  return null;
}

/** RSSI dBm: выше (ближе к 0) — лучше. */
export function signalStatusLevel(dbm: number): StatusLevel {
  if (dbm >= -70) return "good";
  if (dbm >= -85) return "warn";
  return "bad";
}

export function batteryStatusLevel(percent: number): StatusLevel {
  if (percent >= 50) return "good";
  if (percent >= 20) return "warn";
  return "bad";
}

export function statusColor(level: StatusLevel): string {
  return STATUS_COLORS[level];
}

export function latestMetricPoint(
  points: TelemetryPoint[] | undefined,
  metric: string,
): TelemetryPoint | undefined {
  if (!points?.length) return undefined;
  let best: TelemetryPoint | undefined;
  for (const p of points) {
    if (p.metric !== metric) continue;
    if (!best || new Date(p.ts).getTime() > new Date(best.ts).getTime()) best = p;
  }
  return best;
}

export function formatSignalDbm(dbm: number): string {
  return `${dbm} dBm`;
}

export function formatBatteryPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
