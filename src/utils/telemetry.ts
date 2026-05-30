import type { TelemetryPoint } from "../api";

export type Preset = "24h" | "7d" | "14d" | "30d" | "custom";

export const CHART_COLORS = [
  "#F5A623",
  "#5D4037",
  "#1976d2",
  "#2e7d32",
  "#9c27b0",
  "#d32f2f",
  "#00838f",
  "#6d4c41",
];

export function numericFromValue(metric: string, value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (metric === "temperature_c" && typeof v.celsius === "number") return v.celsius;
  if (metric === "relative_humidity" && typeof v.percent === "number") return v.percent;
  return null;
}

export function formatChartLabel(ts: string): string {
  return new Date(ts).toLocaleString("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pointsToSingleSeries(
  points: TelemetryPoint[],
  metric: string,
  valueKey: string,
): Record<string, string | number>[] {
  return points
    .map((r) => ({
      ts: new Date(r.ts).getTime(),
      label: formatChartLabel(r.ts),
      value: numericFromValue(metric, r.value),
    }))
    .filter((r) => r.value != null)
    .sort((a, b) => a.ts - b.ts)
    .map(({ label, value }) => ({ label, [valueKey]: value as number }));
}

export type ColonySeries = {
  colonyId: number;
  name: string;
  points: TelemetryPoint[];
};

export function mergeColonySeries(
  series: ColonySeries[],
  metric: string,
): { data: Record<string, string | number>[]; keys: { id: number; name: string; dataKey: string }[] } {
  const byTs = new Map<number, Record<string, string | number>>();
  const keys = series.map((s) => ({
    id: s.colonyId,
    name: s.name,
    dataKey: `c${s.colonyId}`,
  }));

  for (const s of series) {
    for (const p of s.points) {
      const val = numericFromValue(metric, p.value);
      if (val == null) continue;
      const ts = new Date(p.ts).getTime();
      let row = byTs.get(ts);
      if (!row) {
        row = { ts, label: formatChartLabel(p.ts) };
        byTs.set(ts, row);
      }
      row[`c${s.colonyId}`] = val;
    }
  }

  const data = [...byTs.values()].sort((a, b) => (a.ts as number) - (b.ts as number));
  return { data, keys };
}
