import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api, type EdgeDevice } from "../api";
import { ConcentratorDetailHeader } from "../components/ConcentratorDetailHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EdgeDeviceCard } from "../components/EdgeDeviceCard";
import { FormDialog } from "../components/FormDialog";
import { SerialMonitorDialog } from "../components/SerialMonitorDialog";
import { useSnackbar } from "../components/SnackbarProvider";

function colonyStatusLabel(
  colonyId: number | null,
  colonies: { id: number; name: string }[] | undefined,
): string {
  if (colonyId == null) return "Не привязано";
  return colonies?.find((c) => c.id === colonyId)?.name ?? `Семья #${colonyId}`;
}

export function ConcentratorDetailPage() {
  const { concentratorId: rawId } = useParams();
  const concentratorId = rawId ? Number(rawId) : NaN;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const concentrator = useQuery({
    queryKey: ["concentrator", concentratorId],
    queryFn: () => api.concentrator(concentratorId),
    enabled: Number.isFinite(concentratorId),
    refetchInterval: 30_000,
  });

  const apiaryId = concentrator.data?.apiary_id ?? null;

  const edgeDevices = useQuery({
    queryKey: ["edge-devices", "concentrator", concentratorId],
    queryFn: () => api.edgeDevicesByConcentrator(concentratorId),
    enabled: Number.isFinite(concentratorId),
    refetchInterval: 30_000,
  });

  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);

  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<EdgeDevice | null>(null);
  const [publicId, setPublicId] = useState("");
  const [label, setLabel] = useState("");
  const [colonyId, setColonyId] = useState<number | "">("");
  const [deleteDevice, setDeleteDevice] = useState<EdgeDevice | null>(null);
  const [serialDevice, setSerialDevice] = useState<EdgeDevice | null>(null);

  const openEditName = () => {
    if (!concentrator.data) return;
    setName(concentrator.data.name);
    setEditNameOpen(true);
  };

  const saveName = useMutation({
    mutationFn: () => api.updateConcentrator(concentratorId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setEditNameOpen(false);
      showSuccess("Концентратор обновлён");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка"),
  });

  const removeConc = useMutation({
    mutationFn: () => api.deleteConcentrator(concentratorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      showSuccess("Концентратор удалён");
      navigate("/devices");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Не удалось удалить"),
  });

  const openCreateDevice = () => {
    setEditDevice(null);
    setPublicId("");
    setLabel("");
    setColonyId("");
    setDeviceDialogOpen(true);
  };

  const openEditDevice = (item: EdgeDevice) => {
    setEditDevice(item);
    setPublicId(item.public_id);
    setLabel(item.label ?? "");
    setColonyId(item.current_colony_id ?? "");
    setDeviceDialogOpen(true);
  };

  const saveDevice = useMutation({
    mutationFn: async () => {
      const targetColonyId = colonyId === "" ? null : Number(colonyId);
      if (editDevice) {
        await api.updateEdgeDevice(editDevice.id, {
          public_id: publicId,
          label: label || null,
        });
        if (targetColonyId !== editDevice.current_colony_id) {
          await api.setDeviceColony(editDevice.id, targetColonyId);
        }
        return;
      }
      return api.createEdgeDevice({
        concentrator_id: concentratorId,
        public_id: publicId,
        label: label || null,
        colony_id: targetColonyId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", "concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDeviceDialogOpen(false);
      showSuccess(editDevice ? "Устройство обновлено" : "Устройство создано");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка"),
  });

  const removeDevice = useMutation({
    mutationFn: (id: number) => api.deleteEdgeDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", "concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDeleteDevice(null);
      showSuccess("Устройство удалено");
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

  if (!Number.isFinite(concentratorId)) {
    return <Typography color="error">Некорректный ID концентратора</Typography>;
  }

  if (concentrator.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!concentrator.data) {
    return <Typography color="text.secondary">Концентратор не найден</Typography>;
  }

  const conc = concentrator.data;

  return (
    <>
      <Button component={RouterLink} to="/devices" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        К списку концентраторов
      </Button>

      <ConcentratorDetailHeader
        item={conc}
        onEdit={openEditName}
        onDelete={() => setDeleteOpen(true)}
        onCopyToken={copyToken}
        onOpenSerial={() => setSerialOpen(true)}
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Ульевые устройства</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateDevice}>
          Добавить
        </Button>
      </Box>

      {edgeDevices.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Не удалось загрузить устройства:{" "}
          {edgeDevices.error instanceof Error ? edgeDevices.error.message : "ошибка сети"}
        </Alert>
      ) : null}

      {edgeDevices.isLoading ? (
        <CircularProgress size={28} />
      ) : (edgeDevices.data ?? []).length === 0 ? (
        <Typography color="text.secondary">Нет устройств на этом концентраторе.</Typography>
      ) : (
        <Grid container spacing={2}>
          {(edgeDevices.data ?? []).map((dev) => (
            <Grid key={dev.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <EdgeDeviceCard
                item={dev}
                apiaryId={apiaryId}
                colonyLabel={colonyStatusLabel(dev.current_colony_id, colonies.data)}
                onEdit={() => openEditDevice(dev)}
                onDelete={() => setDeleteDevice(dev)}
                onOpenSerial={() => setSerialDevice(dev)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <SerialMonitorDialog
        open={serialOpen}
        onClose={() => setSerialOpen(false)}
        deviceLabel={`концентратор ${conc.name}`}
      />

      <SerialMonitorDialog
        open={serialDevice != null}
        onClose={() => setSerialDevice(null)}
        deviceLabel={serialDevice?.label || serialDevice?.public_id || "устройство"}
      />

      <FormDialog
        open={editNameOpen}
        title="Название концентратора"
        onClose={() => setEditNameOpen(false)}
        onSubmit={() => saveName.mutate()}
        submitting={saveName.isPending}
        submitDisabled={!name.trim()}
      >
        <TextField
          autoFocus
          fullWidth
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormDialog>

      <FormDialog
        open={deviceDialogOpen}
        title={editDevice ? "Редактировать устройство" : "Новое устройство"}
        onClose={() => setDeviceDialogOpen(false)}
        onSubmit={() => saveDevice.mutate()}
        submitting={saveDevice.isPending}
        submitDisabled={!publicId.trim()}
        maxWidth="sm"
      >
        <TextField
          autoFocus
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
        open={deleteOpen}
        title="Удалить концентратор?"
        message="Концентратор и все привязанные устройства будут удалены."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => removeConc.mutate()}
        loading={removeConc.isPending}
      />

      <ConfirmDialog
        open={deleteDevice != null}
        title="Удалить устройство?"
        message="Устройство будет удалено из системы."
        onCancel={() => setDeleteDevice(null)}
        onConfirm={() => deleteDevice && removeDevice.mutate(deleteDevice.id)}
        loading={removeDevice.isPending}
      />
    </>
  );
}
