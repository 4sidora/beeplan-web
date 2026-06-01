import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api, type EdgeDevice, type FirmwareBuild } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { FirmwareVersionInfo } from "../components/FirmwareVersionInfo";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { FIRMWARE_BOARDS, type FirmwareBoardId } from "../constants/boards";
import { useApiaryParam } from "../hooks/useApiaryParam";

function randomPublicId(): string {
  const part = crypto.randomUUID().split("-")[0];
  return `edge-${part}`;
}

const steps = ["Концентратор", "Устройство", "Сборка", "Прошивка"];

type DeviceMode = "new" | "existing";

function applyExistingDevice(device: EdgeDevice, setters: {
  setConcentratorId: (id: number) => void;
  setEdgeDeviceId: (id: number) => void;
  setPublicId: (id: string) => void;
  setLabel: (id: string) => void;
  setColonyId: (id: number | "") => void;
  setSelectedExistingId: (id: number) => void;
  setDeviceMode: (mode: DeviceMode) => void;
}) {
  setters.setConcentratorId(device.concentrator_id);
  setters.setEdgeDeviceId(device.id);
  setters.setPublicId(device.public_id);
  setters.setLabel(device.label ?? "");
  setters.setColonyId(device.current_colony_id ?? "");
  setters.setSelectedExistingId(device.id);
  setters.setDeviceMode("existing");
}

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
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("new");
  const [selectedExistingId, setSelectedExistingId] = useState<number | "">("");
  const [wakeInterval, setWakeInterval] = useState(600);
  const [board, setBoard] = useState<FirmwareBoardId>("esp32dev");
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

  const edgeDevices = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId!),
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

  useEffect(() => {
    const deviceUrl = searchParams.get("edge_device_id");
    if (!deviceUrl || !edgeDevices.data?.length) return;
    const device = edgeDevices.data.find((d) => d.id === Number(deviceUrl));
    if (!device) return;
    applyExistingDevice(device, {
      setConcentratorId: (id) => setConcentratorId(id),
      setEdgeDeviceId,
      setPublicId,
      setLabel,
      setColonyId,
      setSelectedExistingId,
      setDeviceMode,
    });
    setActiveStep(1);
  }, [searchParams, edgeDevices.data]);

  const existingForConc = (edgeDevices.data ?? []).filter(
    (d) => d.concentrator_id === concentratorId,
  );

  const selectedConc = concentrators.data?.find((c) => c.id === concentratorId);
  const gatewayReady = Boolean(selectedConc?.gateway_mac);

  const startBuild = useMutation({
    mutationFn: (deviceId: number) =>
      api.createFirmwareBuild({
        device_type: "edge",
        board,
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

  const beginExistingBuild = () => {
    const id = Number(selectedExistingId);
    if (!Number.isFinite(id)) return;
    const device = existingForConc.find((d) => d.id === id);
    if (!device) return;
    setEdgeDeviceId(device.id);
    setPublicId(device.public_id);
    setLabel(device.label ?? "");
    setActiveStep(2);
    startBuild.mutate(device.id);
  };

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
          <Button component={RouterLink} to="/devices" size="small">
            К устройствам
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
        <FirmwareVersionInfo deviceType="edge" build={build} compact={activeStep < 2} />

        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ApiarySelect value={apiaryId} onChange={setApiaryId} />
            <TextField
              select
              label="Концентратор"
              value={concentratorId}
              onChange={(e) => {
                setConcentratorId(Number(e.target.value));
                setSelectedExistingId("");
              }}
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
                <RouterLink to={`/devices/install/gateway?concentrator_id=${concentratorId}`}>
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
            <RadioGroup
              row
              value={deviceMode}
              onChange={(e) => setDeviceMode(e.target.value as DeviceMode)}
            >
              <FormControlLabel value="existing" control={<Radio />} label="Существующее устройство" />
              <FormControlLabel value="new" control={<Radio />} label="Новое устройство" />
            </RadioGroup>

            <TextField
              select
              label="Плата (MCU)"
              value={board}
              onChange={(e) => setBoard(e.target.value as FirmwareBoardId)}
              fullWidth
              helperText="CORE-ESP32-C3 и платы с CH343/CH340 — первый пункт. Super Mini с USB на чипе — «нативный USB»"
            >
              {FIRMWARE_BOARDS.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.label}
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

            {deviceMode === "existing" ? (
              <>
                {existingForConc.length === 0 ? (
                  <Alert severity="warning">
                    У этого концентратора нет зарегистрированных устройств. Выберите «Новое устройство»
                    или{" "}
                    <RouterLink to="/devices">создайте устройство</RouterLink> в списке.
                  </Alert>
                ) : (
                  <TextField
                    select
                    label="Устройство"
                    value={selectedExistingId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedExistingId(id);
                      const device = existingForConc.find((d) => d.id === id);
                      if (device) {
                        setPublicId(device.public_id);
                        setLabel(device.label ?? "");
                        setColonyId(device.current_colony_id ?? "");
                      }
                    }}
                    fullWidth
                  >
                    {existingForConc.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.label || d.public_id} · {d.public_id}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                {selectedExistingId !== "" && (
                  <Alert severity="info">
                    В прошивку будет записан существующий <strong>DEVICE_PUBLIC_ID</strong>:{" "}
                    {publicId}
                  </Alert>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button onClick={() => setActiveStep(0)}>Назад</Button>
                  <Button
                    variant="contained"
                    disabled={
                      selectedExistingId === "" ||
                      startBuild.isPending ||
                      existingForConc.length === 0
                    }
                    onClick={beginExistingBuild}
                  >
                    Собрать прошивку
                  </Button>
                </Box>
              </>
            ) : (
              <>
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
              </>
            )}
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
            <Alert severity="info">
              После прошивки закройте эту вкладку, иначе COM-порт занят WebSerial — Arduino IDE
              покажет «Serial port busy».
            </Alert>
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
