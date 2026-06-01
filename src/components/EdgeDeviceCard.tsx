import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TerminalIcon from "@mui/icons-material/Terminal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { EdgeDevice } from "../api";
import { formatLastSeen } from "../utils/formatLastSeen";
import { formatTelemetryValue } from "../utils/formatTelemetryValue";

type Props = {
  item: EdgeDevice;
  apiaryId: number | null;
  colonyLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onOpenSerial: () => void;
};

export function EdgeDeviceCard({
  item,
  apiaryId,
  colonyLabel,
  onEdit,
  onDelete,
  onOpenSerial,
}: Props) {
  const online =
    item.last_seen_at != null && Date.now() - new Date(item.last_seen_at).getTime() < 300_000;
  const telemetry = item.recent_unbound_telemetry ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box>
            <Typography variant="h6" component="h2">
              {item.label || item.public_id}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
              {item.public_id}
            </Typography>
          </Box>
          <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Последний контакт: {formatLastSeen(item.last_seen_at)}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Концентратор: {item.concentrator_name ?? `#${item.concentrator_id}`}
        </Typography>
        <Chip
          size="small"
          label={colonyLabel}
          color={item.current_colony_id != null ? "success" : "default"}
          variant="outlined"
          sx={{ mb: 1.5 }}
        />

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom>
          Телеметрия без семьи
        </Typography>
        {telemetry.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Нет записей (устройство не привязано к семье или данных ещё не было).
          </Typography>
        ) : (
          <List dense disablePadding>
            {telemetry.map((p, i) => (
              <ListItem key={`${p.ts}-${p.metric}-${i}`} disableGutters sx={{ py: 0.25 }}>
                <ListItemText
                  primary={`${p.metric}: ${formatTelemetryValue(p.metric, p.value)}`}
                  secondary={new Date(p.ts).toLocaleString()}
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
      <CardActions sx={{ flexWrap: "wrap", gap: 0.5, px: 2, pb: 2 }}>
        <Button size="small" variant="outlined" startIcon={<TerminalIcon />} onClick={onOpenSerial}>
          Монитор порта
        </Button>
        <Button
          size="small"
          variant="contained"
          component={RouterLink}
          to={`/devices/install/edge?edge_device_id=${item.id}&concentrator_id=${item.concentrator_id}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`}
        >
          Прошить
        </Button>
        <IconButton size="small" onClick={onEdit} aria-label="Редактировать">
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={onDelete} aria-label="Удалить">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}
