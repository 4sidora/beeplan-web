import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TerminalIcon from "@mui/icons-material/Terminal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { Concentrator } from "../api";
import { formatLastSeen } from "../utils/formatLastSeen";

type Props = {
  item: Concentrator;
  onEdit: () => void;
  onDelete: () => void;
  onCopyToken: (token: string) => void;
  onOpenSerial: () => void;
};

function ParamRow({ label, value }: { label: string; value: React.ReactNode }) {
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
  onEdit,
  onDelete,
  onCopyToken,
  onOpenSerial,
}: Props) {
  const online =
    item.last_seen_at != null && Date.now() - new Date(item.last_seen_at).getTime() < 300_000;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              {item.name}
            </Typography>
            <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<TerminalIcon />} onClick={onOpenSerial}>
              Монитор порта
            </Button>
            <Button
              size="small"
              variant="contained"
              component={RouterLink}
              to={`/devices/install/gateway?concentrator_id=${item.id}&apiary_id=${item.apiary_id}`}
            >
              {item.gateway_mac ? "Перепрошить" : "Прошить"}
            </Button>
            <IconButton size="small" onClick={onEdit} aria-label="Редактировать">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={onDelete} aria-label="Удалить">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <ParamRow label="Пасека" value={item.apiary_name ?? `#${item.apiary_id}`} />
          <ParamRow label="Последний контакт" value={formatLastSeen(item.last_seen_at)} />
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
          <ParamRow
            label="Ingest token"
            value={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography component="span" sx={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
                  {item.ingest_token}
                </Typography>
                <Tooltip title="Скопировать">
                  <IconButton size="small" onClick={() => onCopyToken(item.ingest_token)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </Grid>
      </CardContent>
    </Card>
  );
}
