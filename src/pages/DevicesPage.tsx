import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api, type Concentrator } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { BASE_STATION_NAME_PLACEHOLDER } from "../constants/baseStation";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";

function onlineChip(lastSeen: string | null) {
  const online = isDeviceOnline(lastSeen);
  return (
    <Tooltip title={formatLastSeen(lastSeen)}>
      <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
    </Tooltip>
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
  const [nameLoading, setNameLoading] = useState(false);

  const openCreate = async () => {
    setEditItem(null);
    setApiaryId(apiaries.data?.[0]?.id ?? "");
    setDialogOpen(true);
    setNameLoading(true);
    setName("");
    try {
      const suggested = await api.suggestedBaseStationName();
      setName(suggested.name);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Не удалось сгенерировать название");
    } finally {
      setNameLoading(false);
    }
  };

  const openEdit = (item: Concentrator) => {
    setEditItem(item);
    setName(item.name);
    setApiaryId(item.apiary_id);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) return api.updateConcentrator(editItem.id, name);
      if (apiaryId === "") throw new Error("Выберите пасеку");
      return api.createConcentrator(Number(apiaryId), name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDialogOpen(false);
      showSuccess(editItem ? "Базовая станция обновлена" : "Базовая станция создана");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteConcentrator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDeleteItem(null);
      showSuccess("Базовая станция удалена");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Не удалось удалить"),
  });

  return (
    <>
      <PageHeader title="Устройства">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Добавить базовую станцию
        </Button>
      </PageHeader>

      {concentrators.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Не удалось загрузить базовые станции:{" "}
          {concentrators.error instanceof Error ? concentrators.error.message : "ошибка сети"}
        </Alert>
      ) : null}

      {concentrators.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (concentrators.data ?? []).length === 0 ? (
        <Alert severity="info">Добавьте первую базовую станцию.</Alert>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Последний контакт</TableCell>
                <TableCell align="right">Устройств</TableCell>
                <TableCell>Пасека</TableCell>
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
                  <TableCell>{onlineChip(row.last_seen_at)}</TableCell>
                  <TableCell>{formatLastSeen(row.last_seen_at)}</TableCell>
                  <TableCell align="right">{row.edge_device_count ?? 0}</TableCell>
                  <TableCell>{row.apiary_name ?? `#${row.apiary_id}`}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)} aria-label="Редактировать">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editItem ? "Редактировать базовую станцию" : "Новая базовая станция"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название"
            margin="normal"
            placeholder={editItem ? undefined : BASE_STATION_NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editItem && nameLoading}
            slotProps={
              !editItem && nameLoading
                ? {
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ),
                    },
                  }
                : undefined
            }
          />
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
        </DialogContent>
        <DialogActions>
          {editItem ? (
            <Button
              color="error"
              onClick={() => {
                setDialogOpen(false);
                setDeleteItem(editItem);
              }}
              sx={{ mr: "auto" }}
            >
              Удалить
            </Button>
          ) : null}
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={() => save.mutate()}
            disabled={
              (editItem ? !name.trim() : apiaryId === "" || nameLoading || !name.trim()) ||
              save.isPending
            }
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить базовую станцию?"
        message="Базовая станция и все её устройства будут скрыты из списков. Данные в системе сохранятся."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
