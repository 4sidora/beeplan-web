import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
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
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { api, type EdgeDevice } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormDialog } from "../components/FormDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";

export function ColonyDevicesPage() {
  const { colonyId: rawId } = useParams();
  const colonyId = rawId ? Number(rawId) : NaN;
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const colony = useQuery({
    queryKey: ["colony", colonyId],
    queryFn: () => api.colony(colonyId),
    enabled: Number.isFinite(colonyId),
  });

  const apiaryId = colony.data?.apiary_id ?? null;

  const concentrators = useQuery({
    queryKey: ["concentrators", apiaryId],
    queryFn: () => api.concentrators(apiaryId!),
    enabled: apiaryId != null,
  });

  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const { data: allDevices = [], isLoading } = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId!),
    enabled: apiaryId != null,
  });

  const devices = allDevices.filter((d) => d.current_colony_id === colonyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EdgeDevice | null>(null);
  const [publicId, setPublicId] = useState("");
  const [label, setLabel] = useState("");
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [assignColonyId, setAssignColonyId] = useState<number | "">("");
  const [deleteItem, setDeleteItem] = useState<EdgeDevice | null>(null);

  const detailPath =
    colony.data != null
      ? `/colonies/${colony.data.id}?apiary_id=${colony.data.apiary_id}`
      : "/colonies";

  const openCreate = () => {
    setEditItem(null);
    setPublicId("");
    setLabel("");
    setConcentratorId(concentrators.data?.[0]?.id ?? "");
    setAssignColonyId(colonyId);
    setDialogOpen(true);
  };

  const openEdit = (item: EdgeDevice) => {
    setEditItem(item);
    setPublicId(item.public_id);
    setLabel(item.label ?? "");
    setConcentratorId(item.concentrator_id);
    setAssignColonyId(item.current_colony_id ?? colonyId);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const targetColonyId = assignColonyId === "" ? null : Number(assignColonyId);
      if (editItem) {
        await api.updateEdgeDevice(editItem.id, {
          public_id: publicId,
          label: label || null,
        });
        if (targetColonyId !== editItem.current_colony_id) {
          await api.setDeviceColony(editItem.id, targetColonyId);
        }
        return;
      }
      if (concentratorId === "") throw new Error("Выберите концентратор");
      return api.createEdgeDevice({
        concentrator_id: Number(concentratorId),
        public_id: publicId,
        label: label || null,
        colony_id: targetColonyId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", apiaryId] });
      setDialogOpen(false);
      showSuccess(editItem ? "Устройство обновлено" : "Устройство добавлено");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteEdgeDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", apiaryId] });
      setDeleteItem(null);
      showSuccess("Устройство удалено");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  if (colony.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (colony.isError || !colony.data) {
    return <Typography color="error">Семья не найдена</Typography>;
  }

  return (
    <>
      <PageHeader title={`Устройства: ${colony.data.name}`}>
        <Button component={RouterLink} to={detailPath} startIcon={<ArrowBackIcon />}>
          К карточке семьи
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={!concentrators.data?.length}
        >
          Добавить устройство
        </Button>
      </PageHeader>

      {!concentrators.data?.length ? (
        <Typography color="text.secondary">
          Сначала создайте концентратор для этой пасеки.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : devices.length === 0 ? (
        <Typography color="text.secondary">Нет привязанных устройств.</Typography>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Public ID</TableCell>
                <TableCell>Метка</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>{row.public_id}</TableCell>
                  <TableCell>{row.label ?? "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" label="Привязано" color="success" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteItem(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <FormDialog
        open={dialogOpen}
        title={editItem ? "Редактировать устройство" : "Новое устройство"}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => save.mutate()}
        submitting={save.isPending}
        submitDisabled={!publicId.trim()}
        maxWidth="sm"
      >
        {!editItem && (
          <FormControl fullWidth margin="normal">
            <InputLabel id="conc-label">Концентратор</InputLabel>
            <Select
              labelId="conc-label"
              label="Концентратор"
              value={concentratorId}
              onChange={(e) => setConcentratorId(Number(e.target.value))}
            >
              {(concentrators.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          autoFocus={!!editItem}
          fullWidth
          label="Public ID"
          margin="normal"
          value={publicId}
          onChange={(e) => setPublicId(e.target.value)}
        />
        <TextField
          fullWidth
          label="Метка"
          margin="normal"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="colony-label">Семья</InputLabel>
          <Select
            labelId="colony-label"
            label="Семья"
            value={assignColonyId}
            onChange={(e) => {
              const v = e.target.value as number | "";
              setAssignColonyId(v === "" ? "" : v);
            }}
          >
            <MenuItem value="">— не привязано —</MenuItem>
            {(colonies.data ?? []).map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FormDialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить устройство?"
        message="Устройство будет удалено из системы."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
