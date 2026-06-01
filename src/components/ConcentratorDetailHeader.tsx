import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import type { Concentrator } from "../api";
import { ObjectCardHeader } from "./ObjectCardHeader";

type Props = {
  item: Concentrator;
  onEdit: () => void;
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

export function ConcentratorDetailHeader({ item, onEdit }: Props) {
  const flashUrl = `/devices/install/gateway?concentrator_id=${item.id}&apiary_id=${item.apiary_id}`;

  return (
    <Box sx={{ mb: 3 }}>
      <ObjectCardHeader
        title={item.name}
        lastSeenAt={item.last_seen_at}
        titleVariant="h5"
        secondaryActions={[{ label: "Перепрошить", to: flashUrl, variant: "outlined" }]}
        primaryAction={{ label: "Редактировать", onClick: onEdit, variant: "contained" }}
      />
      <Card variant="outlined">
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
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
