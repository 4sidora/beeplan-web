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
  batteryVoltsFromValue,
  formatBatteryStatus,
  formatSignalDbm,
  latestBatteryPoint,
  latestMetricPoint,
  signalDbmFromValue,
  signalStatusLevel,
  statusColor,
} from "../utils/deviceStatus";

type Props = {
  recentTelemetry?: TelemetryPoint[];
  signalDbm?: number | null;
  batteryVolts?: number | null;
  signalTs?: string | null;
  batteryTs?: string | null;
  /** Только иконки; значения — в подсказке без даты. */
  iconsOnly?: boolean;
};

function BatteryIcon({ percent }: { percent: number }) {
  if (percent >= 50) return <BatteryFullIcon fontSize="small" />;
  if (percent >= 20) return <Battery60Icon fontSize="small" />;
  return <Battery20Icon fontSize="small" />;
}

export function DeviceStatusIndicators({
  recentTelemetry,
  signalDbm: signalProp,
  batteryVolts: batteryVoltsProp,
  signalTs: signalTsProp,
  batteryTs: batteryTsProp,
  iconsOnly = false,
}: Props) {
  const signalPoint = latestMetricPoint(recentTelemetry, "signal_level");
  const batteryPoint = latestBatteryPoint(recentTelemetry);

  const signalDbm =
    signalProp ?? (signalPoint ? signalDbmFromValue(signalPoint.value) : null);
  const batteryVolts =
    batteryVoltsProp ??
    (batteryPoint ? batteryVoltsFromValue(batteryPoint.value) : null);
  const batteryPercent =
    batteryVolts != null
      ? batteryPercentFromValue({ volts: batteryVolts }, "battery_voltage")
      : batteryPoint
        ? batteryPercentFromValue(batteryPoint.value, batteryPoint.metric)
        : null;
  const batteryLabel =
    batteryVolts != null
      ? formatBatteryStatus({ volts: batteryVolts }, "battery_voltage")
      : batteryPoint
        ? formatBatteryStatus(batteryPoint.value, batteryPoint.metric)
        : null;
  const signalTs = signalTsProp ?? signalPoint?.ts ?? null;
  const batteryTs = batteryTsProp ?? batteryPoint?.ts ?? null;

  if (signalDbm == null && batteryPercent == null) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: iconsOnly ? "nowrap" : "wrap",
        gap: iconsOnly ? 0.5 : 1.5,
        alignItems: "center",
      }}
    >
      {signalDbm != null &&
        (iconsOnly ? (
          <Tooltip title={formatSignalDbm(signalDbm)}>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                color: statusColor(signalStatusLevel(signalDbm)),
                lineHeight: 0,
              }}
            >
              <SignalCellularAltIcon fontSize="small" />
            </Box>
          </Tooltip>
        ) : (
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
        ))}
      {batteryPercent != null &&
        batteryLabel != null &&
        (iconsOnly ? (
          <Tooltip title={batteryLabel}>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                color: statusColor(batteryStatusLevel(batteryPercent)),
                lineHeight: 0,
              }}
            >
              <BatteryIcon percent={batteryPercent} />
            </Box>
          </Tooltip>
        ) : (
          <Tooltip title={`Батарея · ${formatDateTime(batteryTs)}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ color: statusColor(batteryStatusLevel(batteryPercent)), display: "flex" }}>
                <BatteryIcon percent={batteryPercent} />
              </Box>
              <Typography
                variant="body2"
                sx={{ color: statusColor(batteryStatusLevel(batteryPercent)), fontWeight: 600 }}
              >
                {batteryLabel}
              </Typography>
            </Box>
          </Tooltip>
        ))}
    </Box>
  );
}
