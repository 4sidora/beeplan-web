import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
import { api, type EdgeDevice } from "../api";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormDialog } from "./FormDialog";
import { EDGE_DEVICE_METRICS_LABEL } from "../utils/colonyCatalog";

type Props = {
  colonyId: number;
  apiaryId: number;
  showTitle?: boolean;
};

export function ColonyDevicesSection({ colonyId, apiaryId, showTitle = true }: Props) {
  const qc = useQueryClient();

  const concentrators = useQuery({
    queryKey: ["concentrators", apiaryId],
    queryFn: () => api.concentrators(apiaryId),
  });

  const { data: allDevices = [], isLoading } = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId),
  });

  const devices = allDevices.filter((d) => d.current_colony_id === colonyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EdgeDevice | null>(null);
  const [publicId, setPublicId] = useState("");
  const [label, setLabel] = useState("");
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [deleteItem, setDeleteItem] = useState<EdgeDevice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setPublicId("");
    setLabel("");
    setConcentratorId(concentrators.data?.[0]?.id ?? "");
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const openEdit = (item: EdgeDevice) => {
    setEditItem(item);
    setPublicId(item.public_id);
    setLabel(item.label ?? "");
    setConcentratorId(item.concentrator_id);
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) {
        await api.updateEdgeDevice(editItem.id, {
          public_id: publicId,
          label: label || null,
        });
        return;
      }
      if (concentratorId === "") throw new Error("Выберите концентратор");
      return api.createEdgeDevice({
        concentrator_id: Number(concentratorId),
        public_id: publicId,
        label: label || null,
        colony_id: colonyId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", apiaryId] });
      setDialogOpen(false);
      setErrorMsg(null);
    },
    onError: (e) => setErrorMsg(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteEdgeDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", apiaryId] });
      setDeleteItem(null);
    },
    onError: (e) => setErrorMsg(String((e as Error).message)),
  });

  return (
    <Box sx={{ mb: 3 }}>
      {showTitle && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6">Подключённые устройства</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!concentrators.data?.length}
          >
            Добавить устройство
          </Button>
        </Box>
      )}

      {!showTitle && (
        <Box sx={{ mb: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!concentrators.data?.length}
          >
            Добавить устройство
          </Button>
        </Box>
      )}

      {errorMsg && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {!concentrators.data?.length ? (
        <Typography color="text.secondary">Сначала создайте концентратор для этой пасеки.</Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : devices.length === 0 ? (
        <Typography color="text.secondary">Нет привязанных устройств.</Typography>
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Public ID</TableCell>
                <TableCell>Метка</TableCell>
                <TableCell>Концентратор</TableCell>
                <TableCell>Данные</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{row.public_id}</TableCell>
                  <TableCell>{row.label ?? "—"}</TableCell>
                  <TableCell>{row.concentrator_name ?? `ID ${row.concentrator_id}`}</TableCell>
                  <TableCell>
                    <Chip size="small" label={EDGE_DEVICE_METRICS_LABEL} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)} title="Редактировать">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteItem(row)}
                      title="Удалить"
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
      </FormDialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить устройство?"
        message="Устройство будет удалено из системы."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </Box>
  );
}
