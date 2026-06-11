import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryPoint } from "../api";
import { voltageToPercent } from "../utils/battery";
import {
  batteryStatusLevel,
  statusColor,
} from "../utils/deviceStatus";
import {
  DATA_GAP_AREA_PROPS,
  findDataGaps,
  formatChartLabel,
  insertGapBreaks,
  resolvePeriodBounds,
} from "../utils/telemetry";
import { batteryVoltsFromValue } from "../utils/deviceStatus";

type Props = {
  points: TelemetryPoint[] | undefined;
  /** Таймлайн для поиска пропусков (обычно signal_level). */
  gapReferencePoints?: TelemetryPoint[];
  compact?: boolean;
  periodFrom?: string;
  periodTo?: string;
  /** Интервал замера устройства (wake_interval_sec), секунды. */
  wakeIntervalSec?: number | null;
};

type BatteryRow = {
  ts: number;
  label: string;
  volts: number;
  percent: number;
};

function pointsToBatteryRows(points: TelemetryPoint[]): BatteryRow[] {
  return points
    .map((p) => {
      const volts = batteryVoltsFromValue(p.value);
      if (volts == null) return null;
      return {
        ts: new Date(p.ts).getTime(),
        label: formatChartLabel(p.ts),
        volts,
        percent: voltageToPercent(volts),
      };
    })
    .filter((r): r is BatteryRow => r != null)
    .sort((a, b) => a.ts - b.ts);
}

function pointsToGapTimeline(points: TelemetryPoint[]): { ts: number }[] {
  return points
    .map((p) => ({ ts: new Date(p.ts).getTime() }))
    .filter((p) => Number.isFinite(p.ts))
    .sort((a, b) => a.ts - b.ts);
}

export function BatteryVoltageChart({
  points,
  gapReferencePoints,
  compact,
  periodFrom,
  periodTo,
  wakeIntervalSec,
}: Props) {
  const chartHeight = compact ? 140 : 280;
  const rows = useMemo(() => pointsToBatteryRows(points ?? []), [points]);

  const { gaps, periodFromMs, periodToMs } = useMemo(() => {
    const { periodFromMs: fromMs, periodToMs: toMs } = resolvePeriodBounds(periodFrom, periodTo);
    const gapSource =
      (gapReferencePoints?.length ? gapReferencePoints : points) ?? [];
    const gapPoints =
      gapSource.length > 0 ? pointsToGapTimeline(gapSource) : rows.map((r) => ({ ts: r.ts }));
    const gaps = findDataGaps(gapPoints, {
      periodFrom: fromMs,
      periodTo: toMs,
      expectedIntervalSec: wakeIntervalSec,
    });
    return { gaps, periodFromMs: fromMs, periodToMs: toMs };
  }, [rows, gapReferencePoints, points, periodFrom, periodTo, wakeIntervalSec]);

  const chartData = useMemo(
    () => insertGapBreaks(rows, ["volts", "percent"], gaps),
    [rows, gaps],
  );

  const xDomain = useMemo((): [number, number] => {
    const tsValues = chartData.map((r) => r.ts).filter((ts) => Number.isFinite(ts));
    if (tsValues.length === 0) {
      return [periodFromMs ?? 0, periodToMs ?? 1];
    }
    return [periodFromMs ?? Math.min(...tsValues), periodToMs ?? Math.max(...tsValues)];
  }, [chartData, periodFromMs, periodToMs]);

  const lastPercent = rows.at(-1)?.percent;
  const batteryColor =
    typeof lastPercent === "number" ? statusColor(batteryStatusLevel(lastPercent)) : "#2e7d32";

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant={chartHeight < 200 ? "subtitle1" : "h6"} gutterBottom>
        Батарея
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary">Нет данных за выбранный период</Typography>
      ) : (
        <Box sx={{ width: "100%", height: chartHeight, minHeight: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              {gaps.map((gap) => (
                <ReferenceArea
                  key={`${gap.fromTs}-${gap.toTs}`}
                  x1={gap.fromTs}
                  x2={gap.toTs}
                  yAxisId="volts"
                  {...DATA_GAP_AREA_PROPS}
                />
              ))}
              <XAxis
                dataKey="ts"
                type="number"
                domain={xDomain}
                scale="time"
                minTickGap={32}
                tick={{ fontSize: 11 }}
                tickFormatter={(ts) => formatChartLabel(ts as number)}
              />
              <YAxis
                yAxisId="volts"
                orientation="left"
                domain={["auto", "auto"]}
                unit=" V"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(ts) => formatChartLabel(ts as number)}
                formatter={(value: number, name: string) => {
                  if (value == null) return ["—", name];
                  if (name === "volts") return [`${Number(value).toFixed(2)} V`, "Напряжение"];
                  if (name === "percent") return [`${Math.round(Number(value))}%`, "Заряд"];
                  return [value, name];
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "volts" ? "Напряжение" : value === "percent" ? "Заряд" : value
                }
              />
              <Line
                yAxisId="volts"
                type="monotone"
                dataKey="volts"
                name="volts"
                dot={false}
                strokeWidth={2}
                connectNulls={false}
                stroke={batteryColor}
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="percent"
                name="percent"
                dot={false}
                strokeWidth={2}
                connectNulls={false}
                stroke="#78909c"
                strokeDasharray="4 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
