import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api, type Concentrator } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { formatLastSeen } from "../utils/formatLastSeen";

function onlineChip(lastSeen: string | null) {
  const online =
    lastSeen != null && Date.now() - new Date(lastSeen).getTime() < 300_000;
  return (
    <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
  );
}

export function DevicesPage() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });

  const concentrators = useQuery({
    queryKey: ["concentrators-all"],
    queryFn: () => api.allConcentrators(),
    refetchInterval: 30_000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Concentrator | null>(null);
  const [name, setName] = useState("");
  const [apiaryId, setApiaryId] = useState<number | "">("");
  const [deleteItem, setDeleteItem] = useState<Concentrator | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setName("");
    setApiaryId(apiaries.data?.[0]?.id ?? "");
    setNewToken(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Concentrator) => {
    setEditItem(item);
    setName(item.name);
    setApiaryId(item.apiary_id);
    setNewToken(null);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) return api.updateConcentrator(editItem.id, name);
      if (apiaryId === "") throw new Error("Выберите пасеку");
      return api.createConcentrator(Number(apiaryId), name);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      if (!editItem) setNewToken(result.ingest_token);
      else {
        setDialogOpen(false);
        showSuccess("Концентратор обновлён");
      }
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteConcentrator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDeleteItem(null);
      showSuccess("Концентратор удалён");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Не удалось удалить"),
  });

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showSuccess("Токен скопирован");
    } catch {
      showError("Не удалось скопировать");
    }
  };

  return (
    <>
      <PageHeader title="Устройства">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Добавить концентратор
        </Button>
      </PageHeader>

      {concentrators.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Не удалось загрузить концентраторы:{" "}
          {concentrators.error instanceof Error ? concentrators.error.message : "ошибка сети"}
        </Alert>
      ) : null}

      {concentrators.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (concentrators.data ?? []).length === 0 ? (
        <Alert severity="info">Добавьте первый концентратор.</Alert>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Пасека</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Последний контакт</TableCell>
                <TableCell>MAC</TableCell>
                <TableCell align="right">Устройств</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(concentrators.data ?? []).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/devices/${row.id}`}
                      size="small"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                    >
                      {row.name}
                    </Button>
                  </TableCell>
                  <TableCell>{row.apiary_name ?? `#${row.apiary_id}`}</TableCell>
                  <TableCell>{onlineChip(row.last_seen_at)}</TableCell>
                  <TableCell>{formatLastSeen(row.last_seen_at)}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {row.gateway_mac ?? "—"}
                  </TableCell>
                  <TableCell align="right">{row.edge_device_count ?? 0}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Скопировать токен">
                      <IconButton size="small" onClick={() => copyToken(row.ingest_token)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => openEdit(row)} aria-label="Редактировать">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteItem(row)}
                      aria-label="Удалить"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editItem ? "Редактировать концентратор" : "Новый концентратор"}</DialogTitle>
        <DialogContent>
          {newToken && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Ingest token (сохраните для gateway):{" "}
              <Typography component="span" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {newToken}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                sx={{ ml: 1 }}
                onClick={() => copyToken(newToken)}
              >
                Копировать
              </Button>
            </Alert>
          )}
          {!editItem && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="apiary-pick">Пасека</InputLabel>
              <Select
                labelId="apiary-pick"
                label="Пасека"
                value={apiaryId}
                onChange={(e) => setApiaryId(Number(e.target.value))}
              >
                {(apiaries.data ?? []).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Название"
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{newToken ? "Закрыть" : "Отмена"}</Button>
          {!newToken && (
            <Button
              variant="contained"
              onClick={() => save.mutate()}
              disabled={!name.trim() || (!editItem && apiaryId === "") || save.isPending}
            >
              Сохранить
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить концентратор?"
        message="Концентратор и все привязанные устройства будут удалены."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
