import type { TelemetryPoint } from "../api";
import { formatBatterySummary, voltageToPercent } from "./battery";

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

export function batteryVoltsFromValue(value: unknown): number | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const volts = (value as Record<string, unknown>).volts;
    if (typeof volts === "number" && Number.isFinite(volts)) return volts;
  }
  return null;
}

/** Процент из battery_voltage или legacy battery_percent. */
export function batteryPercentFromValue(value: unknown, metric?: string): number | null {
  if (metric === "battery_voltage") {
    const volts = batteryVoltsFromValue(value);
    return volts != null ? voltageToPercent(volts) : null;
  }
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const volts = batteryVoltsFromValue(value);
    if (volts != null) return voltageToPercent(volts);
    const percent = (value as Record<string, unknown>).percent;
    if (typeof percent === "number" && Number.isFinite(percent)) return Math.round(percent);
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

export function latestBatteryPoint(
  points: TelemetryPoint[] | undefined,
): TelemetryPoint | undefined {
  return (
    latestMetricPoint(points, "battery_voltage") ??
    latestMetricPoint(points, "battery_percent")
  );
}

export function formatSignalDbm(dbm: number): string {
  return `${dbm} dBm`;
}

export function formatBatteryPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatBatteryStatus(value: unknown, metric?: string): string | null {
  const volts = batteryVoltsFromValue(value);
  if (volts != null) return formatBatterySummary(volts);
  if (metric === "battery_percent" || metric == null) {
    const pct = batteryPercentFromValue(value, metric);
    if (pct != null) return formatBatteryPercent(pct);
  }
  return null;
}
