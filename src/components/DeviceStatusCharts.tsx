import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import type { TelemetryPoint } from "../api";
import { TelemetryChart } from "./TelemetryChart";
import { pointsToSingleSeries } from "../utils/telemetry";
import {
  batteryStatusLevel,
  signalStatusLevel,
  statusColor,
} from "../utils/deviceStatus";

type Props = {
  signalPoints: TelemetryPoint[] | undefined;
  batteryPoints: TelemetryPoint[] | undefined;
  loading?: boolean;
  compact?: boolean;
  periodFrom?: string;
  periodTo?: string;
};

export function DeviceStatusCharts({
  signalPoints,
  batteryPoints,
  loading,
  compact,
  periodFrom,
  periodTo,
}: Props) {
  if (loading) {
    return <CircularProgress sx={{ mb: compact ? 2 : 3 }} />;
  }

  const chartHeight = compact ? 140 : 280;
  const signalChart = pointsToSingleSeries(signalPoints ?? [], "signal_level", "signal");
  const batteryChart = pointsToSingleSeries(batteryPoints ?? [], "battery_percent", "battery");

  const lastSignal = signalChart.at(-1)?.signal;
  const lastBattery = batteryChart.at(-1)?.battery;
  const signalColor =
    typeof lastSignal === "number" ? statusColor(signalStatusLevel(lastSignal)) : "#1976d2";
  const batteryColor =
    typeof lastBattery === "number" ? statusColor(batteryStatusLevel(lastBattery)) : "#2e7d32";

  return (
    <Grid container spacing={2} sx={{ mb: compact ? 2 : 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TelemetryChart
          variant="single"
          title="Уровень сигнала"
          data={signalChart}
          dataKey="signal"
          unit="dBm"
          color={signalColor}
          height={chartHeight}
          periodFrom={periodFrom}
          periodTo={periodTo}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TelemetryChart
          variant="single"
          title="Заряд батареи"
          data={batteryChart}
          dataKey="battery"
          unit="%"
          color={batteryColor}
          height={chartHeight}
          periodFrom={periodFrom}
          periodTo={periodTo}
        />
      </Grid>
    </Grid>
  );
}
