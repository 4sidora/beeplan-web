import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ConcentratorDetailHeader } from "../components/ConcentratorDetailHeader";
import { DetailStickyHeader } from "../components/DetailStickyHeader";
import { DeviceStatusDetails } from "../components/DeviceStatusDetails";
import { useLocalTelemetryPeriod } from "../hooks/useLocalTelemetryPeriod";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EdgeDeviceCard } from "../components/EdgeDeviceCard";
import { FormDialog } from "../components/FormDialog";
import { useSnackbar } from "../components/SnackbarProvider";
import { EDGE_DEVICE_NAME_PLACEHOLDER } from "../constants/edgeDevice";
import { toUserFacingError } from "../utils/userFacingError";

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

  const [statusExpanded, setStatusExpanded] = useState(false);

  const { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso } =
    useLocalTelemetryPeriod();

  const concentrator = useQuery({
    queryKey: ["concentrator", concentratorId],
    queryFn: () => api.concentrator(concentratorId),
    enabled: Number.isFinite(concentratorId),
    refetchInterval: 60_000,
  });

  const signalQuery = useQuery({
    queryKey: ["concentrator-telemetry", concentratorId, "signal_level", fromIso, toIso],
    queryFn: () =>
      api.concentratorTelemetry(concentratorId, {
        metric: "signal_level",
        from: fromIso,
        to: toIso,
        limit: 5000,
      }),
    enabled: Number.isFinite(concentratorId) && statusExpanded,
  });

  const batteryQuery = useQuery({
    queryKey: ["concentrator-telemetry", concentratorId, "battery_voltage", fromIso, toIso],
    queryFn: () =>
      api.concentratorTelemetry(concentratorId, {
        metric: "battery_voltage",
        from: fromIso,
        to: toIso,
        limit: 5000,
      }),
    enabled: Number.isFinite(concentratorId) && statusExpanded,
  });

  const apiaryId = concentrator.data?.apiary_id ?? null;

  const edgeDevices = useQuery({
    queryKey: ["edge-devices", "concentrator", concentratorId],
    queryFn: () => api.edgeDevicesByConcentrator(concentratorId),
    enabled: Number.isFinite(concentratorId),
    refetchInterval: 60_000,
  });

  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [colonyId, setColonyId] = useState<number | "">("");
  const [wakeBulkOpen, setWakeBulkOpen] = useState(false);
  const [bulkWakeInterval, setBulkWakeInterval] = useState(3600);

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
      showSuccess("Базовая станция обновлена");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка"),
  });

  const removeConc = useMutation({
    mutationFn: () => api.deleteConcentrator(concentratorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      showSuccess("Базовая станция удалена");
      navigate("/devices");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Не удалось удалить"),
  });

  const openCreateDevice = () => {
    setDeviceName("");
    setColonyId("");
    setDeviceDialogOpen(true);
  };

  const saveBulkWake = useMutation({
    mutationFn: () => api.bulkSetEdgeWakeInterval(concentratorId, bulkWakeInterval),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["edge-devices", "concentrator", concentratorId] });
      setWakeBulkOpen(false);
      showSuccess(`Интервал обновлён для ${result.updated} устройств`);
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка"),
  });

  const saveDevice = useMutation({
    mutationFn: async () => {
      const targetColonyId = colonyId === "" ? null : Number(colonyId);
      return api.createEdgeDevice({
        concentrator_id: concentratorId,
        name: deviceName.trim() || null,
        colony_id: targetColonyId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", "concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrator", concentratorId] });
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDeviceDialogOpen(false);
      showSuccess("Устройство создано");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка"),
  });

  if (!Number.isFinite(concentratorId)) {
    return <Typography color="error">Некорректный ID базовой станции</Typography>;
  }

  if (concentrator.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!concentrator.data) {
    return <Typography color="text.secondary">Базовая станция не найдена</Typography>;
  }

  const conc = concentrator.data;
  const flashUrl = `/devices/install/gateway?concentrator_id=${conc.id}&apiary_id=${conc.apiary_id}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <DetailStickyHeader
        backTo="/devices"
        backLabel="К списку базовых станций"
        title={conc.name}
        lastSeenAt={conc.last_seen_at}
        recentTelemetry={conc.recent_telemetry}
        secondaryActions={[{ label: "Перепрошить", to: flashUrl, variant: "outlined" }]}
        primaryAction={{ label: "Редактировать", onClick: openEditName, variant: "contained" }}
      />

      <ConcentratorDetailHeader
        item={conc}
        statusExpanded={statusExpanded}
        onStatusToggle={() => setStatusExpanded((v) => !v)}
        statusDetails={
          <DeviceStatusDetails
            signalPoints={signalQuery.data}
            batteryPoints={batteryQuery.data}
            chartsLoading={signalQuery.isLoading || batteryQuery.isLoading}
            compact
            preset={preset}
            onPresetChange={setPreset}
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
          />
        }
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6">Подключенные устройства</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            disabled={(edgeDevices.data ?? []).length === 0}
            onClick={() => setWakeBulkOpen(true)}
          >
            Интервал замера для всех
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateDevice}>
            Добавить
          </Button>
        </Box>
      </Box>

      {edgeDevices.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {toUserFacingError(edgeDevices.error, "Не удалось загрузить устройства")}
        </Alert>
      ) : null}

      {edgeDevices.isLoading ? (
        <CircularProgress size={28} />
      ) : (edgeDevices.data ?? []).length === 0 ? (
        <Typography color="text.secondary">Нет устройств на этой базовой станции.</Typography>
      ) : (
        <Grid container spacing={2}>
          {(edgeDevices.data ?? []).map((dev) => (
            <Grid key={dev.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <EdgeDeviceCard
                item={dev}
                colonyLabel={colonyStatusLabel(dev.current_colony_id, colonies.data)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <FormDialog
        open={editNameOpen}
        title="Название базовой станции"
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
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            setEditNameOpen(false);
            setDeleteOpen(true);
          }}
          sx={{ mt: 2 }}
        >
          Удалить
        </Button>
      </FormDialog>

      <FormDialog
        open={deviceDialogOpen}
        title="Новое устройство"
        onClose={() => setDeviceDialogOpen(false)}
        onSubmit={() => saveDevice.mutate()}
        submitting={saveDevice.isPending}
        submitDisabled={false}
        maxWidth="sm"
      >
        <TextField
          autoFocus
          fullWidth
          label="Название"
          margin="normal"
          placeholder={EDGE_DEVICE_NAME_PLACEHOLDER}
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
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

      <FormDialog
        open={wakeBulkOpen}
        title="Интервал замера для всех устройств"
        onClose={() => setWakeBulkOpen(false)}
        onSubmit={() => saveBulkWake.mutate()}
        submitting={saveBulkWake.isPending}
        submitDisabled={bulkWakeInterval < 10 || bulkWakeInterval > 86400}
        maxWidth="sm"
      >
        <TextField
          autoFocus
          fullWidth
          label="Интервал замера (сек)"
          type="number"
          margin="normal"
          value={bulkWakeInterval}
          onChange={(e) => setBulkWakeInterval(Number(e.target.value))}
          inputProps={{ min: 10, max: 86400, step: 1 }}
          helperText="Применится ко всем устройствам этой базовой станции через gateway при следующем контакте."
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить базовую станцию?"
        message="Базовая станция и все её устройства будут скрыты из списков. Данные в системе сохранятся."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => removeConc.mutate()}
        loading={removeConc.isPending}
      />
    </LocalizationProvider>
  );
}
