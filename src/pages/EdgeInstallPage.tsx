import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api, type FirmwareBuild } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { useApiaryParam } from "../hooks/useApiaryParam";

function randomPublicId(): string {
  const part = crypto.randomUUID().split("-")[0];
  return `edge-${part}`;
}

const steps = ["Концентратор", "Устройство", "Сборка", "Прошивка"];

export function EdgeInstallPage() {
  const { showError, showSuccess } = useSnackbar();
  const [apiaryId, setApiaryId] = useApiaryParam();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [colonyId, setColonyId] = useState<number | "">("");
  const [publicId, setPublicId] = useState(randomPublicId);
  const [label, setLabel] = useState("");
  const [edgeDeviceId, setEdgeDeviceId] = useState<number | null>(null);
  const [wakeInterval, setWakeInterval] = useState(600);
  const [build, setBuild] = useState<FirmwareBuild | null>(null);
  const [polling, setPolling] = useState(false);

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

  useEffect(() => {
    const fromUrl = searchParams.get("concentrator_id");
    if (fromUrl) {
      setConcentratorId(Number(fromUrl));
    }
    const colonyUrl = searchParams.get("colony_id");
    if (colonyUrl) setColonyId(Number(colonyUrl));
  }, [searchParams]);

  const selectedConc = concentrators.data?.find((c) => c.id === concentratorId);
  const gatewayReady = Boolean(selectedConc?.gateway_mac);

  const startBuild = useMutation({
    mutationFn: (deviceId: number) =>
      api.createFirmwareBuild({
        device_type: "edge",
        board: "esp32dev",
        concentrator_id: Number(concentratorId),
        edge_device_id: deviceId,
        wake_interval_sec: wakeInterval,
      }),
    onSuccess: (result) => {
      setBuild(result);
      setPolling(true);
    },
    onError: (e: Error) => showError(e.message),
  });

  const registerDevice = useMutation({
    mutationFn: () =>
      api.createEdgeDevice({
        concentrator_id: Number(concentratorId),
        public_id: publicId,
        label: label || `Улей ${publicId}`,
        colony_id: colonyId === "" ? null : Number(colonyId),
      }),
    onSuccess: (device) => {
      setEdgeDeviceId(device.id);
      showSuccess("Устройство зарегистрировано в API");
      setActiveStep(2);
      startBuild.mutate(device.id);
    },
    onError: (e: Error) => showError(e.message),
  });

  useEffect(() => {
    if (!polling || !build) return;
    const id = build.id;
    const timer = setInterval(async () => {
      try {
        const status = await api.firmwareBuild(id);
        setBuild(status);
        if (status.status === "ready") {
          setPolling(false);
          setActiveStep(3);
        } else if (status.status === "failed") {
          setPolling(false);
          showError(status.error || "Сборка не удалась");
        }
      } catch (e) {
        setPolling(false);
        showError(e instanceof Error ? e.message : "Ошибка опроса сборки");
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [polling, build, showError]);

  return (
    <Box>
      <PageHeader
        title="Прошивка улья (edge)"
        actions={
          <Button component={RouterLink} to="/install" size="small">
            К обзору
          </Button>
        }
      />

      {!isWebSerialSupported() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          WebSerial недоступен — используйте Chrome или Edge на ПК.
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((s) => (
          <Step key={s}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, maxWidth: 640 }}>
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ApiarySelect value={apiaryId} onChange={setApiaryId} />
            <TextField
              select
              label="Концентратор"
              value={concentratorId}
              onChange={(e) => setConcentratorId(Number(e.target.value))}
              fullWidth
            >
              {(concentrators.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.gateway_mac ? ` · ${c.gateway_mac}` : " · нет MAC"}
                </MenuItem>
              ))}
            </TextField>
            {!gatewayReady && concentratorId !== "" && (
              <Alert severity="warning">
                Сначала{" "}
                <RouterLink to={`/install/gateway?concentrator_id=${concentratorId}`}>
                  прошейте концентратор
                </RouterLink>
                , чтобы зарегистрировать MAC.
              </Alert>
            )}
            {selectedConc?.gateway_mac && (
              <Alert severity="info">Gateway MAC: {selectedConc.gateway_mac}</Alert>
            )}
            <Button
              variant="contained"
              disabled={!concentratorId || !gatewayReady}
              onClick={() => setActiveStep(1)}
            >
              Далее
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Public ID (DEVICE_PUBLIC_ID)"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              fullWidth
            />
            <TextField label="Метка" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
            <TextField
              select
              label="Семья (опционально)"
              value={colonyId}
              onChange={(e) => setColonyId(e.target.value === "" ? "" : Number(e.target.value))}
              fullWidth
            >
              <MenuItem value="">— не привязывать —</MenuItem>
              {(colonies.data ?? []).map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Интервал замера (сек)"
              type="number"
              value={wakeInterval}
              onChange={(e) => setWakeInterval(Number(e.target.value))}
              fullWidth
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Назад</Button>
              <Button
                variant="contained"
                disabled={registerDevice.isPending}
                onClick={() => registerDevice.mutate()}
              >
                Зарегистрировать и собрать
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && edgeDeviceId != null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography>Устройство #{edgeDeviceId} · {publicId}</Typography>
            <Button
              variant="contained"
              disabled={startBuild.isPending}
              onClick={() => edgeDeviceId != null && startBuild.mutate(edgeDeviceId)}
            >
              Пересобрать прошивку
            </Button>
            {(polling || build) && build && (
              <>
                <Typography>
                  Статус: <strong>{build.status}</strong>
                </Typography>
                {(build.status === "queued" || build.status === "building") && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography color="text.secondary">Сборка…</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {activeStep === 3 && build?.status === "ready" && build.manifest_url && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="success">Прошивка готова. Подключите ESP32 улья и прошейте.</Alert>
            <EspWebInstallButton manifestUrl={build.manifest_url} />
            <Button variant="contained" component={RouterLink} to="/devices">
              К списку устройств
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
