import type { TelemetryPoint } from "../api";
import { formatTelemetryValue } from "./formatTelemetryValue";

const METRIC_LABELS: Record<string, string> = {
  temperature_c: "Температура",
  relative_humidity: "Влажность",
  signal_level: "Сигнал",
  battery_voltage: "Напряжение батареи",
  battery_percent: "Заряд батареи",
  firmware_version: "Прошивка",
  audio_features: "Аудио",
  weight_kg: "Вес",
  weight: "Вес",
};

export function metricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric;
}

/** Последняя точка по каждой метрике (по времени ts). */
export function latestTelemetryByMetric(points: TelemetryPoint[]): TelemetryPoint[] {
  const byMetric = new Map<string, TelemetryPoint>();
  for (const p of points) {
    const prev = byMetric.get(p.metric);
    if (!prev || new Date(p.ts).getTime() > new Date(prev.ts).getTime()) {
      byMetric.set(p.metric, p);
    }
  }
  return [...byMetric.values()].sort((a, b) => a.metric.localeCompare(b.metric));
}

export function telemetryBadgeLabel(point: TelemetryPoint): string {
  return formatTelemetryValue(point.metric, point.value);
}
