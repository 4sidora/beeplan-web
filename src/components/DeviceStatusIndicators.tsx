import Battery20Icon from "@mui/icons-material/Battery20";
import Battery60Icon from "@mui/icons-material/Battery60";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { TelemetryPoint } from "../api";
import { formatDateTime } from "../utils/formatDateTime";
import {
  batteryPercentFromValue,
  batteryStatusLevel,
  formatBatteryPercent,
  formatSignalDbm,
  latestMetricPoint,
  signalDbmFromValue,
  signalStatusLevel,
  statusColor,
} from "../utils/deviceStatus";

type Props = {
  recentTelemetry?: TelemetryPoint[];
  signalDbm?: number | null;
  batteryPercent?: number | null;
  signalTs?: string | null;
  batteryTs?: string | null;
};

function BatteryIcon({ percent }: { percent: number }) {
  if (percent >= 50) return <BatteryFullIcon fontSize="small" />;
  if (percent >= 20) return <Battery60Icon fontSize="small" />;
  return <Battery20Icon fontSize="small" />;
}

export function DeviceStatusIndicators({
  recentTelemetry,
  signalDbm: signalProp,
  batteryPercent: batteryProp,
  signalTs: signalTsProp,
  batteryTs: batteryTsProp,
}: Props) {
  const signalPoint = latestMetricPoint(recentTelemetry, "signal_level");
  const batteryPoint = latestMetricPoint(recentTelemetry, "battery_percent");

  const signalDbm =
    signalProp ?? (signalPoint ? signalDbmFromValue(signalPoint.value) : null);
  const batteryPercent =
    batteryProp ?? (batteryPoint ? batteryPercentFromValue(batteryPoint.value) : null);
  const signalTs = signalTsProp ?? signalPoint?.ts ?? null;
  const batteryTs = batteryTsProp ?? batteryPoint?.ts ?? null;

  if (signalDbm == null && batteryPercent == null) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
      {signalDbm != null && (
        <Tooltip title={`Сигнал · ${formatDateTime(signalTs)}`}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SignalCellularAltIcon
              fontSize="small"
              sx={{ color: statusColor(signalStatusLevel(signalDbm)) }}
            />
            <Typography
              variant="body2"
              sx={{ color: statusColor(signalStatusLevel(signalDbm)), fontWeight: 600 }}
            >
              {formatSignalDbm(signalDbm)}
            </Typography>
          </Box>
        </Tooltip>
      )}
      {batteryPercent != null && (
        <Tooltip title={`Батарея · ${formatDateTime(batteryTs)}`}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ color: statusColor(batteryStatusLevel(batteryPercent)), display: "flex" }}>
              <BatteryIcon percent={batteryPercent} />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: statusColor(batteryStatusLevel(batteryPercent)), fontWeight: 600 }}
            >
              {formatBatteryPercent(batteryPercent)}
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
