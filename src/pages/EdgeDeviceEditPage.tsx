import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { formatWakeInterval } from "../utils/edgeTiming";

export function EdgeDeviceEditPage() {
  const { deviceId: rawId } = useParams();
  const deviceId = rawId ? Number(rawId) : NaN;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();

  const device = useQuery({
    queryKey: ["edge-device", deviceId],
    queryFn: () => api.edgeDevice(deviceId),
    enabled: Number.isFinite(deviceId),
  });

  const concentrator = useQuery({
    queryKey: ["concentrator", device.data?.concentrator_id],
    queryFn: () => api.concentrator(device.data!.concentrator_id),
    enabled: device.data != null,
  });

  const apiaryId = concentrator.data?.apiary_id ?? null;

  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const [deviceName, setDeviceName] = useState("");
  const [colonyId, setColonyId] = useState<number | "">("");
  const [wakeInterval, setWakeInterval] = useState(3600);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!device.data) return;
    setDeviceName(device.data.name ?? "");
    setColonyId(device.data.current_colony_id ?? "");
    setWakeInterval(device.data.wake_interval_sec ?? 3600);
  }, [device.data]);

  const save = useMutation({
    mutationFn: async () => {
      const targetColonyId = colonyId === "" ? null : Number(colonyId);
      await api.updateEdgeDevice(deviceId, {
        name: deviceName.trim() || null,
        wake_interval_sec: wakeInterval,
      });
      if (device.data && targetColonyId !== device.data.current_colony_id) {
        await api.setDeviceColony(deviceId, targetColonyId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-device", deviceId] });
      if (device.data) {
        qc.invalidateQueries({
          queryKey: ["edge-devices", "concentrator", device.data.concentrator_id],
        });
        qc.invalidateQueries({ queryKey: ["concentrator", device.data.concentrator_id] });
      }
      showSuccess("Устройство сохранено");
      navigate(`/devices/edge/${deviceId}`);
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteEdgeDevice(deviceId),
    onSuccess: () => {
      const concId = device.data?.concentrator_id;
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      if (concId != null) {
        qc.invalidateQueries({ queryKey: ["edge-devices", "concentrator", concId] });
        qc.invalidateQueries({ queryKey: ["concentrator", concId] });
      }
      showSuccess("Устройство удалено");
      navigate(concId != null ? `/devices/${concId}` : "/devices");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Не удалось удалить"),
  });

  if (!Number.isFinite(deviceId)) {
    return <Typography color="error">Некорректный ID устройства</Typography>;
  }

  if (device.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!device.data) {
    return <Typography color="text.secondary">Устройство не найдено</Typography>;
  }

  const d = device.data;
  const backUrl = `/devices/edge/${d.id}`;

  return (
    <>
      <Button component={RouterLink} to={backUrl} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        К просмотру устройства
      </Button>

      <PageHeader title="Редактирование устройства" />

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Public ID: <Typography component="span" sx={{ fontFamily: "monospace" }}>{d.public_id}</Typography>
          {" "}(не редактируется)
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Название"
          margin="normal"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Интервал замера (сек)"
          type="number"
          value={wakeInterval}
          onChange={(e) => setWakeInterval(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 10, max: 86400, step: 1 } }}
          helperText={`Сейчас в БД: ${formatWakeInterval(d.wake_interval_sec)}. Новое значение дойдёт до устройства через базовую станцию при следующем контакте.`}
        />
        <Alert severity="info" sx={{ mt: 1 }}>
          Перепрошивка не нужна — gateway передаст интервал в ACK при следующей отправке телеметрии.
        </Alert>
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

        <Box sx={{ display: "flex", gap: 1, mt: 3, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button component={RouterLink} to={backUrl}>
            Отмена
          </Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            sx={{ ml: "auto" }}
          >
            Удалить
          </Button>
        </Box>
      </Paper>

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить устройство?"
        message="Устройство будет скрыто из списков. Данные в системе сохранятся."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
      />
    </>
  );
}
