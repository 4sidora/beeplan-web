import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { Concentrator } from "../api";
import { DeviceStatusToggle } from "./DeviceStatusToggle";

type Props = {
  item: Concentrator;
  statusExpanded?: boolean;
  onStatusToggle?: () => void;
  statusDetails?: ReactNode;
};

function ParamRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  );
}

export function ConcentratorDetailHeader({
  item,
  statusExpanded = false,
  onStatusToggle,
  statusDetails,
}: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <ParamRow label="Пасека" value={item.apiary_name ?? `#${item.apiary_id}`} />
          <ParamRow
            label="MAC gateway"
            value={
              <Typography component="span" sx={{ fontFamily: "monospace", fontSize: 14 }}>
                {item.gateway_mac ?? "не зарегистрирован"}
              </Typography>
            }
          />
          <ParamRow label="Прошивка" value={item.firmware_version ?? "—"} />
          <ParamRow label="Ульевых устройств" value={item.edge_device_count ?? 0} />
          {onStatusToggle && (
            <Grid size={{ xs: 12 }}>
              <DeviceStatusToggle
                recentTelemetry={item.recent_telemetry}
                expanded={statusExpanded}
                onToggle={onStatusToggle}
              />
            </Grid>
          )}
        </Grid>
        {statusDetails && onStatusToggle && (
          <Collapse in={statusExpanded}>{statusDetails}</Collapse>
        )}
      </CardContent>
    </Card>
  );
}
