import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Concentrator } from "../api";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";
import { ObjectCardHeader } from "./ObjectCardHeader";

type Props = {
  item: Concentrator;
  apiaryId: number | null;
  onEdit: () => void;
};

export function ConcentratorCard({ item, apiaryId, onEdit }: Props) {
  const flashUrl = `/devices/install/gateway?concentrator_id=${item.id}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <ObjectCardHeader
        title={item.name}
        lastSeenAt={item.last_seen_at}
        secondaryActions={[{ label: "Перепрошить", to: flashUrl, variant: "outlined" }]}
        primaryAction={{ label: "Редактировать", onClick: onEdit, variant: "contained" }}
      />
      <Card variant="outlined" sx={{ flexGrow: 1 }}>
        <CardContent>
          <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12, mb: 0.5 }}>
            MAC: {item.gateway_mac ?? "не зарегистрирован"}
          </Typography>
          {item.wifi_channel != null && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Wi‑Fi канал: {item.wifi_channel}
            </Typography>
          )}
          {(item.spool_pending_count ?? 0) > 0 && (
            <Alert severity="warning" sx={{ py: 0, mb: 1 }}>
              Очередь uplink: {item.spool_pending_count} записей
            </Alert>
          )}
          {item.firmware_version && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Прошивка: {item.firmware_version}
            </Typography>
          )}
          <DeviceStatusIndicators recentTelemetry={item.recent_telemetry} />
        </CardContent>
      </Card>
    </Box>
  );
}
