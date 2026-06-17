import DevicesIcon from "@mui/icons-material/Devices";
import MemoryIcon from "@mui/icons-material/Memory";
import YardIcon from "@mui/icons-material/Yard";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { Concentrator } from "../api";
import { DeviceOnlineDot } from "./DeviceOnlineDot";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";

type Props = {
  item: Concentrator;
  apiaryLabel: string;
};

export function ConcentratorCard({ item, apiaryLabel }: Props) {
  const detailUrl = `/devices/${item.id}`;
  const firmwareLabel = item.firmware_version ?? "—";
  const deviceCount = item.edge_device_count ?? 0;

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
              {item.name}
            </Typography>
            <DeviceOnlineDot lastSeenAt={item.last_seen_at} />
            <DeviceStatusIndicators recentTelemetry={item.recent_telemetry} iconsOnly />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            <Tooltip title={`Пасека: ${apiaryLabel}`}>
              <Chip size="small" icon={<YardIcon />} label={apiaryLabel} variant="outlined" />
            </Tooltip>
            <Tooltip title={`Прошивка ${firmwareLabel}`}>
              <Chip size="small" icon={<MemoryIcon />} label={firmwareLabel} variant="outlined" />
            </Tooltip>
            <Tooltip title="Подключённых устройств">
              <Chip
                size="small"
                icon={<DevicesIcon />}
                label={String(deviceCount)}
                variant="outlined"
              />
            </Tooltip>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
