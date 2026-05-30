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
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api, type EdgeDevice } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormDialog } from "../components/FormDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { useApiaryParam } from "../hooks/useApiaryParam";

function colonyStatusLabel(
  colonyId: number | null,
  colonies: { id: number; name: string }[] | undefined,
): string {
  if (colonyId == null) return "Не привязано";
  return colonies?.find((c) => c.id === colonyId)?.name ?? `Семья #${colonyId}`;
}

export function DevicesPage() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [apiaryId, setApiaryId] = useApiaryParam();

  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });
  useEffect(() => {
    if (apiaryId == null && apiaries.data?.[0]) {
      setApiaryId(apiaries.data[0].id);
    }
  }, [apiaryId, apiaries.data, setApiaryId]);

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

  const { data = [], isLoading } = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId!),
    enabled: apiaryId != null,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EdgeDevice | null>(null);
  const [publicId, setPublicId] = useState("");
  const [label, setLabel] = useState("");
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [colonyId, setColonyId] = useState<number | "">("");
  const [deleteItem, setDeleteItem] = useState<EdgeDevice | null>(null);

  const concName = (id: number) =>
    concentrators.data?.find((c) => c.id === id)?.name ?? `#${id}`;

  const openCreate = () => {
    setEditItem(null);
    setPublicId("");
    setLabel("");
    setConcentratorId(concentrators.data?.[0]?.id ?? "");
    setColonyId("");
    setDialogOpen(true);
  };

  const openEdit = (item: EdgeDevice) => {
    setEditItem(item);
    setPublicId(item.public_id);
    setLabel(item.label ?? "");
    setConcentratorId(item.concentrator_id);
    setColonyId(item.current_colony_id ?? "");
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const targetColonyId = colonyId === "" ? null : Number(colonyId);
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
      showSuccess(editItem ? "Устройство обновлено" : "Устройство создано");
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

  return (
    <>
      <PageHeader title="Устройства">
        <ApiarySelect value={apiaryId} onChange={setApiaryId} />
        <Button component={RouterLink} to="/install/edge" variant="outlined" sx={{ mr: 1 }}>
          Прошить устройство
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={apiaryId == null || !concentrators.data?.length}
        >
          Добавить
        </Button>
      </PageHeader>

      {apiaryId == null ? (
        <Typography color="text.secondary">Выберите пасеку.</Typography>
      ) : !concentrators.data?.length ? (
        <Typography color="text.secondary">
          Сначала создайте концентратор для этой пасеки.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Typography color="text.secondary">Нет устройств.</Typography>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Public ID</TableCell>
                <TableCell>Метка</TableCell>
                <TableCell>Концентратор</TableCell>
                <TableCell>Статус привязки</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>{row.public_id}</TableCell>
                  <TableCell>{row.label ?? "—"}</TableCell>
                  <TableCell>{concName(row.concentrator_id)}</TableCell>
                  <TableCell>
                    {row.current_colony_id != null ? (
                      <Chip
                        size="small"
                        label={colonyStatusLabel(row.current_colony_id, colonies.data)}
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip size="small" label="Не привязано" variant="outlined" />
                    )}
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
          helperText="Идентификатор в прошивке улья (DEVICE_PUBLIC_ID)"
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
            value={colonyId}
            onChange={(e) => {
              const v = e.target.value as number | "";
              setColonyId(v === "" ? "" : v);
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
