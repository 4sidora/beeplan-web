import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { EdgeDevice } from "../api";
import { formatDateTime } from "../utils/formatDateTime";
import { isDeviceOnline } from "../utils/deviceOnline";
import { latestTelemetryByMetric, telemetryBadgeLabel } from "../utils/metricLabels";

type Props = {
  item: EdgeDevice;
  colonyLabel: string;
};

export function EdgeDeviceCard({ item, colonyLabel }: Props) {
  const online = isDeviceOnline(item.last_seen_at);
  const metricBadges = latestTelemetryByMetric(item.recent_telemetry ?? []);
  const noData = metricBadges.length === 0 && item.last_seen_at == null;
  const contactTooltip = `Последний контакт: ${formatDateTime(item.last_seen_at)}`;

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6" component="h2">
            {item.name || item.public_id}
          </Typography>
          <Tooltip title={contactTooltip}>
            <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
          <Chip
            size="small"
            label={`Семья: ${colonyLabel}`}
            color={item.current_colony_id != null ? "success" : "default"}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Прошивка: ${item.firmware_version ?? "—"}`}
            variant="outlined"
          />
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
      <CardActions sx={{ flexWrap: "wrap", gap: 0.5, px: 2, pb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          component={RouterLink}
          to={`/devices/edge/${item.id}`}
        >
          Подробнее
        </Button>
      </CardActions>
    </Card>
  );
}
