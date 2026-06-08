import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { Dayjs } from "dayjs";
import type { TelemetryPoint } from "../api";
import type { Preset } from "../utils/telemetry";
import { DeviceStatusCharts } from "./DeviceStatusCharts";
import { PeriodSelector } from "./PeriodSelector";

type Props = {
  title?: string;
  signalPoints: TelemetryPoint[] | undefined;
  batteryPoints: TelemetryPoint[] | undefined;
  chartsLoading?: boolean;
  compact?: boolean;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  from: Dayjs;
  to: Dayjs;
  onFromChange: (v: Dayjs) => void;
  onToChange: (v: Dayjs) => void;
};

export function DeviceStatusDetails({
  title,
  signalPoints,
  batteryPoints,
  chartsLoading,
  compact,
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
}: Props) {
  return (
    <Box sx={{ mt: 2 }}>
      {title ? (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {title}
        </Typography>
      ) : null}
      <PeriodSelector
        embedded
        preset={preset}
        onPresetChange={onPresetChange}
        from={from}
        to={to}
        onFromChange={onFromChange}
        onToChange={onToChange}
      />
      <DeviceStatusCharts
        signalPoints={signalPoints}
        batteryPoints={batteryPoints}
        loading={chartsLoading}
        compact={compact}
        periodFrom={from.toISOString()}
        periodTo={to.toISOString()}
      />
    </Box>
  );
}
