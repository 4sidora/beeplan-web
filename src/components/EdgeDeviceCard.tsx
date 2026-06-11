import { ColonyIcon } from "../constants/colonyIcon";
import MemoryIcon from "@mui/icons-material/Memory";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { EdgeDevice } from "../api";
import { DeviceOnlineDot } from "./DeviceOnlineDot";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";
import { formatDateTime } from "../utils/formatDateTime";
import { latestTelemetryByMetric, telemetryBadgeLabel } from "../utils/metricLabels";

const CARD_STATUS_METRICS = new Set([
  "signal_level",
  "battery_voltage",
  "battery_percent",
  "firmware_version",
]);

type Props = {
  item: EdgeDevice;
  colonyLabel: string;
};

export function EdgeDeviceCard({ item, colonyLabel }: Props) {
  const detailUrl = `/devices/edge/${item.id}`;
  const metricBadges = latestTelemetryByMetric(item.recent_telemetry ?? []).filter(
    (p) => !CARD_STATUS_METRICS.has(p.metric),
  );
  const hasStatusData =
    item.recent_telemetry?.some(
      (p) =>
        p.metric === "signal_level" ||
        p.metric === "battery_voltage" ||
        p.metric === "battery_percent",
    ) ?? false;
  const noData = metricBadges.length === 0 && !hasStatusData && item.last_seen_at == null;
  const firmwareLabel = item.firmware_version ?? "—";

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        component={RouterLink}
        to={detailUrl}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mb: 1.5,
              minWidth: 0,
              flexWrap: "nowrap",
            }}
          >
            <Typography variant="h6" component="h2" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {item.name || item.public_id}
            </Typography>
            <DeviceOnlineDot
              lastSeenAt={item.last_seen_at}
              wakeIntervalSec={item.wake_interval_sec ?? 3600}
            />
            <DeviceStatusIndicators recentTelemetry={item.recent_telemetry} iconsOnly />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
            <Tooltip title={`Семья: ${colonyLabel}`}>
              <Chip
                size="small"
                icon={<ColonyIcon />}
                label={colonyLabel}
                color={item.current_colony_id != null ? "success" : "default"}
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title={`Прошивка ${firmwareLabel}`}>
              <Chip
                size="small"
                icon={<MemoryIcon />}
                label={firmwareLabel}
                variant="outlined"
              />
            </Tooltip>
          </Box>

          {noData ? (
            <Typography variant="body2" color="text.secondary">
              Данных пока не было.
            </Typography>
          ) : metricBadges.length === 0 ? null : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {metricBadges.map((p) => (
                <Tooltip key={p.metric} title={`Последние данные ${formatDateTime(p.ts)}`}>
                  <Chip size="small" label={telemetryBadgeLabel(p)} variant="outlined" />
                </Tooltip>
              ))}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
