import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import type { Concentrator } from "../api";
import { formatLastSeen } from "../utils/formatLastSeen";

type Props = {
  item: Concentrator;
  apiaryId: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onCopyToken: (token: string) => void;
};

export function ConcentratorCard({ item, apiaryId, onEdit, onDelete, onCopyToken }: Props) {
  const online = item.last_seen_at != null && Date.now() - new Date(item.last_seen_at).getTime() < 300_000;

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6" component="h2">
            {item.name}
          </Typography>
          <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Последний контакт: {formatLastSeen(item.last_seen_at)}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12, mb: 0.5 }}>
          MAC: {item.gateway_mac ?? "не зарегистрирован"}
        </Typography>
        {item.firmware_version && (
          <Typography variant="body2" color="text.secondary">
            Прошивка: {item.firmware_version}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            token: {item.ingest_token.slice(0, 10)}…
          </Typography>
          <Tooltip title="Скопировать токен">
            <IconButton size="small" onClick={() => onCopyToken(item.ingest_token)}>
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
      <CardActions sx={{ flexWrap: "wrap", gap: 0.5, px: 2, pb: 2 }}>
        <Button
          size="small"
          variant="contained"
          component={RouterLink}
          to={`/devices/install/gateway?concentrator_id=${item.id}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`}
        >
          {item.gateway_mac ? "Перепрошить" : "Прошить"}
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
