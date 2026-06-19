import type { TelemetryPoint } from "../api";

export type Preset = "1h" | "24h" | "7d" | "14d" | "30d" | "custom";

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
  if (metric === "battery_voltage" && typeof v.volts === "number") return v.volts;
  if (metric === "battery_percent" && typeof v.percent === "number") return v.percent;
  if (metric === "signal_level" && typeof v.dbm === "number") return v.dbm;
  return null;
}

export function formatChartLabel(ts: string | number): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleString("ru-RU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Короткие подписи оси X в зависимости от длины периода. */
export function formatChartAxisLabel(ts: string | number, periodMs: number): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  const hours = periodMs / (3600 * 1000);
  if (hours <= 25) {
    return d.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  if (hours <= 24 * 8) {
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
    });
  }
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function chartXAxisProps(periodFrom?: string | number, periodTo?: string | number) {
  const { periodFromMs, periodToMs } = resolvePeriodBounds(periodFrom, periodTo);
  const fromMs = periodFromMs ?? 0;
  const toMs = periodToMs ?? Date.now();
  const periodMs = Math.max(1, toMs - fromMs);
  const dense = periodMs > 25 * 3600 * 1000;
  return {
    periodMs,
    minTickGap: dense ? 56 : 40,
    angle: dense ? -35 : 0,
    textAnchor: dense ? ("end" as const) : ("middle" as const),
    height: dense ? 52 : 30,
    tickFormatter: (ts: number) => formatChartAxisLabel(ts, periodMs),
  };
}

export type DataGap = {
  fromTs: number;
  toTs: number;
};

export const DATA_GAP_FILL = "rgba(244, 67, 54, 0.14)";

/** Общие props заливки пропусков на графиках (Recharts ReferenceArea). */
export const DATA_GAP_AREA_PROPS = {
  fill: DATA_GAP_FILL,
  strokeOpacity: 0,
  ifOverflow: "extendDomain" as const,
};

const DEFAULT_GAP_FLOOR_MS = 30 * 60_000;
const UNKNOWN_INTERVAL_GAP_FLOOR_MS = 60_000;
export const DATA_GAP_INTERVAL_MULTIPLIER = 3;

function toTimestamp(value: string | number | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function medianInterval(sortedTs: number[]): number {
  const intervals: number[] = [];
  for (let i = 1; i < sortedTs.length; i++) {
    intervals.push(sortedTs[i] - sortedTs[i - 1]);
  }
  if (intervals.length === 0) return 60 * 60_000;
  const sorted = [...intervals].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Ожидаемый шаг между точками для красных зон пропусков.
 * Если задан wake_interval из БД — используем его; иначе медиана фактических интервалов.
 */
function baselineIntervalMs(
  sortedTs: number[],
  intervalSec: number | null | undefined,
): number | null {
  if (intervalSec != null && intervalSec > 0) {
    return intervalSec * 1000;
  }
  if (sortedTs.length >= 2) {
    return medianInterval(sortedTs);
  }
  return null;
}

/** Порог «нет данных»: базовый шаг × множитель. */
export function gapThresholdMs(options?: {
  expectedIntervalSec?: number | null;
  gapMultiplier?: number;
  sortedTimestamps?: number[];
}): number {
  const gapMultiplier = options?.gapMultiplier ?? DATA_GAP_INTERVAL_MULTIPLIER;
  const sorted = options?.sortedTimestamps ?? [];
  const baseline = baselineIntervalMs(sorted, options?.expectedIntervalSec);
  if (baseline == null) return DEFAULT_GAP_FLOOR_MS;
  return Math.max(baseline * gapMultiplier, UNKNOWN_INTERVAL_GAP_FLOOR_MS);
}

/** Периоды без данных: между точками, а также от начала/конца выбранного интервала. */
export function findDataGaps(
  points: { ts: number }[],
  options?: {
    periodFrom?: number;
    periodTo?: number;
    minGapMs?: number;
    gapMultiplier?: number;
    /** Интервал замера устройства (wake_interval_sec), секунды. */
    expectedIntervalSec?: number | null;
  },
): DataGap[] {
  const { periodFrom, periodTo, gapMultiplier = DATA_GAP_INTERVAL_MULTIPLIER } = options ?? {};
  const sorted = [...points].sort((a, b) => a.ts - b.ts);

  const minGapMs =
    options?.minGapMs ??
    gapThresholdMs({
      expectedIntervalSec: options?.expectedIntervalSec,
      gapMultiplier,
      sortedTimestamps: sorted.map((p) => p.ts),
    });

  if (sorted.length === 0) {
    if (periodFrom != null && periodTo != null && periodTo > periodFrom && periodTo - periodFrom >= minGapMs) {
      return [{ fromTs: periodFrom, toTs: periodTo }];
    }
    return [];
  }

  const gaps: DataGap[] = [];

  if (periodFrom != null && sorted[0].ts - periodFrom >= minGapMs) {
    gaps.push({ fromTs: periodFrom, toTs: sorted[0].ts });
  }

  for (let i = 1; i < sorted.length; i++) {
    const fromTs = sorted[i - 1].ts;
    const toTs = sorted[i].ts;
    if (toTs - fromTs >= minGapMs) {
      gaps.push({ fromTs, toTs });
    }
  }

  if (periodTo != null && periodTo - sorted[sorted.length - 1].ts >= minGapMs) {
    gaps.push({ fromTs: sorted[sorted.length - 1].ts, toTs: periodTo });
  }

  return gaps;
}

function hasGapBetween(gaps: DataGap[], fromTs: number, toTs: number): boolean {
  return gaps.some((g) => g.fromTs === fromTs && g.toTs === toTs);
}

/** Разрывает линию графика в интервалах без данных. */
export function insertGapBreaks(
  data: Record<string, string | number>[],
  valueKeys: string[],
  gaps: DataGap[],
): Record<string, string | number | null>[] {
  if (gaps.length === 0 || data.length === 0) return data;

  const sorted = [...data].sort((a, b) => (a.ts as number) - (b.ts as number));
  const result: Record<string, string | number | null>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i >= sorted.length - 1) continue;

    const fromTs = sorted[i].ts as number;
    const toTs = sorted[i + 1].ts as number;
    if (!hasGapBetween(gaps, fromTs, toTs)) continue;

    const breakRow: Record<string, string | number | null> = {
      ts: fromTs + (toTs - fromTs) / 2,
      label: "",
    };
    for (const key of valueKeys) {
      breakRow[key] = null;
    }
    result.push(breakRow);
  }

  return result;
}

export function resolvePeriodBounds(
  periodFrom?: string | number,
  periodTo?: string | number,
): { periodFromMs?: number; periodToMs?: number } {
  return {
    periodFromMs: toTimestamp(periodFrom) ?? undefined,
    periodToMs: toTimestamp(periodTo) ?? undefined,
  };
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
    .map(({ ts, label, value }) => ({ ts, label, [valueKey]: value as number }));
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

export type TelemetryTableRow = {
  ts: string;
  values: Record<string, unknown>;
};

/** Метрики устройства — в начале таблицы (фиксированный порядок). */
export const TELEMETRY_PRIMARY_METRICS = [
  "temperature_c",
  "relative_humidity",
  "audio_features",
  "weight_kg",
  "weight",
] as const;

/** Сигнал, батарея и прошивка — всегда в конце таблицы. */
export const TELEMETRY_TRAILING_METRICS = [
  "signal_level",
  "battery_voltage",
  "battery_percent",
  "firmware_version",
] as const;

export function sortTelemetryTableMetrics(metrics: Iterable<string>): string[] {
  const set = new Set(metrics);
  const trailing = TELEMETRY_TRAILING_METRICS.filter((m) => set.has(m));
  const primary = [...set].filter(
    (m) => !TELEMETRY_TRAILING_METRICS.includes(m as (typeof TELEMETRY_TRAILING_METRICS)[number]),
  );
  const orderedPrimary = [
    ...TELEMETRY_PRIMARY_METRICS.filter((m) => primary.includes(m)),
    ...primary
      .filter((m) => !TELEMETRY_PRIMARY_METRICS.includes(m as (typeof TELEMETRY_PRIMARY_METRICS)[number]))
      .sort((a, b) => a.localeCompare(b)),
  ];
  return [...orderedPrimary, ...trailing];
}

/** Одна строка на каждый замер; при совпадении ts — отдельные строки, не схлопывать. */
export function pivotTelemetryByTime(points: TelemetryPoint[]): {
  rows: TelemetryTableRow[];
  metrics: string[];
} {
  const metricsSet = new Set<string>();
  for (const point of points) {
    metricsSet.add(point.metric);
  }
  const metrics = sortTelemetryTableMetrics(metricsSet);

  const sorted = [...points].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime(),
  );

  const byTs = new Map<string, TelemetryPoint[]>();
  for (const point of sorted) {
    const bucket = byTs.get(point.ts) ?? [];
    bucket.push(point);
    byTs.set(point.ts, bucket);
  }

  const rows: TelemetryTableRow[] = [];
  const orderedTs = [...byTs.keys()].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  for (const ts of orderedTs) {
    const pts = byTs.get(ts) ?? [];
    const rowBuckets: Record<string, unknown>[] = [];

    for (const point of pts) {
      let placed = false;
      for (const row of rowBuckets) {
        if (row[point.metric] === undefined) {
          row[point.metric] = point.value;
          placed = true;
          break;
        }
      }
      if (!placed) {
        rowBuckets.push({ [point.metric]: point.value });
      }
    }

    for (const values of rowBuckets) {
      rows.push({ ts, values });
    }
  }

  return { rows, metrics };
}
