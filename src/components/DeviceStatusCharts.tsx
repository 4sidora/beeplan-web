import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import type { TelemetryPoint } from "../api";
import { BatteryVoltageChart } from "./BatteryVoltageChart";
import { TelemetryChart } from "./TelemetryChart";
import { pointsToSingleSeries } from "../utils/telemetry";
import { signalStatusLevel, statusColor } from "../utils/deviceStatus";

type Props = {
  signalPoints: TelemetryPoint[] | undefined;
  batteryPoints: TelemetryPoint[] | undefined;
  loading?: boolean;
  compact?: boolean;
  periodFrom?: string;
  periodTo?: string;
  wakeIntervalSec?: number | null;
};

export function DeviceStatusCharts({
  signalPoints,
  batteryPoints,
  loading,
  compact,
  periodFrom,
  periodTo,
  wakeIntervalSec,
}: Props) {
  if (loading) {
    return <CircularProgress sx={{ mb: compact ? 2 : 3 }} />;
  }

  const chartHeight = compact ? 140 : 280;
  const signalChart = pointsToSingleSeries(signalPoints ?? [], "signal_level", "signal");
  const lastSignal = signalChart.at(-1)?.signal;
  const signalColor =
    typeof lastSignal === "number" ? statusColor(signalStatusLevel(lastSignal)) : "#1976d2";

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
          wakeIntervalSec={wakeIntervalSec}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BatteryVoltageChart
          points={batteryPoints}
          gapReferencePoints={signalPoints}
          compact={compact}
          periodFrom={periodFrom}
          periodTo={periodTo}
          wakeIntervalSec={wakeIntervalSec}
        />
      </Grid>
    </Grid>
  );
}
