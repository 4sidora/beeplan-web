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
import {
  CHART_COLORS,
  DATA_GAP_FILL,
  findDataGaps,
  formatChartLabel,
  insertGapBreaks,
  resolvePeriodBounds,
} from "../utils/telemetry";

type PeriodProps = {
  periodFrom?: string | number;
  periodTo?: string | number;
};

type SingleProps = PeriodProps & {
  variant: "single";
  title: string;
  data: Record<string, string | number>[];
  dataKey: string;
  unit: string;
  color?: string;
  height?: number;
};

type MultiProps = PeriodProps & {
  variant: "multi";
  title: string;
  data: Record<string, string | number>[];
  series: { dataKey: string; name: string }[];
  height?: number;
};

type Props = SingleProps | MultiProps;

function useChartGaps(
  data: Record<string, string | number>[],
  periodFrom?: string | number,
  periodTo?: string | number,
) {
  return useMemo(() => {
    const { periodFromMs, periodToMs } = resolvePeriodBounds(periodFrom, periodTo);
    const points = data
      .filter((row) => typeof row.ts === "number")
      .map((row) => ({ ts: row.ts as number }));
    const gaps = findDataGaps(points, { periodFrom: periodFromMs, periodTo: periodToMs });
    return { gaps, periodFromMs, periodToMs };
  }, [data, periodFrom, periodTo]);
}

function useXDomain(
  data: Record<string, string | number | null>[],
  periodFromMs?: number,
  periodToMs?: number,
): [number, number] {
  return useMemo(() => {
    const tsValues = data
      .map((row) => row.ts)
      .filter((ts): ts is number => typeof ts === "number" && Number.isFinite(ts));
    if (tsValues.length === 0) {
      return [periodFromMs ?? 0, periodToMs ?? 1];
    }
    const dataMin = Math.min(...tsValues);
    const dataMax = Math.max(...tsValues);
    return [periodFromMs ?? dataMin, periodToMs ?? dataMax];
  }, [data, periodFromMs, periodToMs]);
}

export function TelemetryChart(props: Props) {
  const { title, data, periodFrom, periodTo } = props;
  const chartHeight = props.height ?? 280;
  const { gaps, periodFromMs, periodToMs } = useChartGaps(data, periodFrom, periodTo);

  const chartData = useMemo(() => {
    if (props.variant === "single") {
      return insertGapBreaks(data, [props.dataKey], gaps);
    }
    return insertGapBreaks(
      data,
      props.series.map((s) => s.dataKey),
      gaps,
    );
  }, [data, gaps, props]);

  const xDomain = useXDomain(chartData, periodFromMs, periodToMs);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant={chartHeight < 200 ? "subtitle1" : "h6"} gutterBottom>
        {title}
      </Typography>
      {data.length === 0 ? (
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
                  fill={DATA_GAP_FILL}
                  strokeOpacity={0}
                  ifOverflow="extendDomain"
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
                domain={["auto", "auto"]}
                unit={props.variant === "single" ? props.unit : undefined}
              />
              <Tooltip
                labelFormatter={(ts) => formatChartLabel(ts as number)}
                formatter={(value: number | string) =>
                  value == null || value === "" ? ["—", ""] : [value, ""]
                }
              />
              <Legend />
              {props.variant === "single" ? (
                <Line
                  type="monotone"
                  dataKey={props.dataKey}
                  name={props.unit}
                  dot={false}
                  strokeWidth={2}
                  connectNulls={false}
                  stroke={props.color ?? CHART_COLORS[0]}
                />
              ) : (
                props.series.map((s, i) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.name}
                    dot={false}
                    strokeWidth={2}
                    connectNulls={false}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
