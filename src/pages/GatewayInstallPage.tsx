import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api, type FirmwareBuild } from "../api";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { FirmwareBuildProgress } from "../components/FirmwareBuildProgress";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { FirmwareBoardPicker } from "../components/FirmwareBoardPicker";
import {
  boardById,
  defaultBoardForProfile,
  type FirmwareBoardId,
} from "../constants/boards";
import { useApiaryParam } from "../hooks/useApiaryParam";
import { toUserFacingError } from "../utils/userFacingError";

const DEFAULT_DEVICE_API_URL = "http://api.beeplan.tech";

function defaultDeviceApiUrl(): string {
  const fromEnv = import.meta.env.VITE_DEVICE_API_URL?.replace(/\/$/, "");
  return fromEnv || DEFAULT_DEVICE_API_URL;
}

const deviceApiUrl = defaultDeviceApiUrl();

const steps = ["Устройство", "Параметры", "Сборка", "Прошивка"];

function parseConcentratorId(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("concentrator_id");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function GatewayInstallPage() {
  const { showError } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const [apiaryId, setApiaryId] = useApiaryParam();
  const concentratorId = useMemo(() => parseConcentratorId(searchParams), [searchParams]);

  const [activeStep, setActiveStep] = useState(0);
  const [uplinkMode, setUplinkMode] = useState<"wifi" | "cellular">("wifi");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [gatewayWifiChannel, setGatewayWifiChannel] = useState(6);
  const [cellularApn, setCellularApn] = useState("");
  const [cellularUser, setCellularUser] = useState("");
  const [cellularPass, setCellularPass] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(deviceApiUrl);
  const [board, setBoard] = useState<FirmwareBoardId>(() => defaultBoardForProfile("gateway"));
  const [debugSerial, setDebugSerial] = useState(true);
  const [build, setBuild] = useState<FirmwareBuild | null>(null);
  const [polling, setPolling] = useState(false);

  const concentrator = useQuery({
    queryKey: ["concentrator", concentratorId],
    queryFn: () => api.concentrator(concentratorId!),
    enabled: concentratorId != null,
  });

  useEffect(() => {
    if (concentrator.data?.apiary_id != null) {
      setApiaryId(concentrator.data.apiary_id);
    }
  }, [concentrator.data?.apiary_id, setApiaryId]);

  const startBuild = useMutation({
    mutationFn: () =>
      api.createFirmwareBuild({
        device_type: "gateway",
        board,
        concentrator_id: concentratorId!,
        uplink_mode: uplinkMode,
        wifi_ssid: uplinkMode === "wifi" ? wifiSsid : undefined,
        wifi_password: uplinkMode === "wifi" ? wifiPassword : undefined,
        gateway_wifi_channel: uplinkMode === "cellular" ? gatewayWifiChannel : undefined,
        cellular_apn: uplinkMode === "cellular" ? cellularApn : undefined,
        cellular_user: uplinkMode === "cellular" ? cellularUser || undefined : undefined,
        cellular_pass: uplinkMode === "cellular" ? cellularPass || undefined : undefined,
        api_base_url: apiBaseUrl,
        debug_serial: debugSerial,
      }),
    onSuccess: (result) => {
      setBuild(result);
      setActiveStep(2);
      setPolling(true);
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

  const conc = concentrator.data;
  const selectedBoard = boardById(board);
  const boardReady = selectedBoard?.firmwareAvailable ?? false;
  const paramsValid =
    uplinkMode === "wifi"
      ? Boolean(wifiSsid && wifiPassword)
      : Boolean(cellularApn && gatewayWifiChannel >= 1 && gatewayWifiChannel <= 13);

  if (concentratorId == null) {
    return (
      <Box>
        <PageHeader title="Прошивка базовой станции" />
        <Alert severity="warning" sx={{ mb: 2 }}>
          Укажите устройство: откройте прошивку из списка{" "}
          <RouterLink to="/devices">устройств</RouterLink> (кнопка «Прошить» у базовой станции).
        </Alert>
        <Button variant="contained" component={RouterLink} to="/devices">
          К устройствам
        </Button>
      </Box>
    );
  }

  if (concentrator.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (concentrator.isError || !conc) {
    return (
      <Box>
        <PageHeader title="Прошивка базовой станции" />
        <Alert severity="error" sx={{ mb: 2 }}>
          Базовая станция не найдена или нет доступа.
        </Alert>
        <Button variant="contained" component={RouterLink} to="/devices">
          К устройствам
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Прошивка базовой станции"
        actions={
          <Button
            component={RouterLink}
            to={apiaryId != null ? `/devices?apiary_id=${apiaryId}` : "/devices"}
            size="small"
          >
            К устройствам
          </Button>
        }
      />

      {!isWebSerialSupported() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          WebSerial недоступен — используйте Chrome или Edge на ПК.
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation={isMobile ? "vertical" : "horizontal"} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: activeStep === 0 ? 1040 : 640 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {conc.name}
        </Typography>

        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FirmwareBoardPicker
              profile="gateway"
              value={board}
              onChange={setBoard}
              deviceType="gateway"
              installedVersion={conc.firmware_version}
            />
            <Button variant="contained" disabled={!boardReady} onClick={() => setActiveStep(1)}>
              Далее
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl>
              <FormLabel id="uplink-mode-label">Передача данных на сервер</FormLabel>
              <RadioGroup
                aria-labelledby="uplink-mode-label"
                value={uplinkMode}
                onChange={(e) => setUplinkMode(e.target.value as "wifi" | "cellular")}
              >
                <FormControlLabel value="wifi" control={<Radio />} label="Wi‑Fi" />
                <FormControlLabel
                  value="cellular"
                  control={<Radio />}
                  label="Сотовая связь (SIM800, TTGO T-Call)"
                />
              </RadioGroup>
            </FormControl>

            {uplinkMode === "wifi" ? (
              <>
                <TextField
                  label="Wi‑Fi SSID"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Wi‑Fi пароль"
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  fullWidth
                />
              </>
            ) : (
              <>
                <TextField
                  label="APN оператора"
                  value={cellularApn}
                  onChange={(e) => setCellularApn(e.target.value)}
                  placeholder="internet"
                  fullWidth
                  required
                />
                <TextField
                  label="Логин GPRS (если нужен)"
                  value={cellularUser}
                  onChange={(e) => setCellularUser(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Пароль GPRS (если нужен)"
                  type="password"
                  value={cellularPass}
                  onChange={(e) => setCellularPass(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Канал Wi‑Fi для ESP-NOW"
                  type="number"
                  slotProps={{ htmlInput: { min: 1, max: 13 } }}
                  helperText="Должен совпадать с каналом сети edge-устройств (обычно 1–13)"
                  value={gatewayWifiChannel}
                  onChange={(e) => setGatewayWifiChannel(Number(e.target.value))}
                  fullWidth
                />
              </>
            )}

            <TextField
              label="URL API для устройства"
              helperText="Публичный адрес API (например https://api.beeplan.tech)"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox checked={debugSerial} onChange={(e) => setDebugSerial(e.target.checked)} />
              }
              label="Отладочный UART-лог (рекомендуется при настройке)"
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Назад</Button>
              <Button
                variant="contained"
                disabled={!paramsValid || startBuild.isPending}
                onClick={() => startBuild.mutate()}
              >
                Собрать прошивку
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && build && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography>
              Статус сборки: <strong>{build.status}</strong>
            </Typography>
            {(build.status === "queued" || build.status === "building" || polling) && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography color="text.secondary">Сборка на сервере…</Typography>
                </Box>
                <FirmwareBuildProgress build={build} deviceType="gateway" />
              </Box>
            )}
            {build.status === "failed" && (
              <>
                <Alert severity="error">{toUserFacingError(build.error, "Ошибка сборки прошивки")}</Alert>
                <Button variant="outlined" onClick={() => setActiveStep(1)}>
                  Вернуться к параметрам
                </Button>
              </>
            )}
          </Box>
        )}

        {activeStep === 3 && build?.status === "ready" && build.manifest_url && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="success">Прошивка готова. Подключите ESP32 и нажмите кнопку ниже.</Alert>
            <EspWebInstallButton manifestUrl={build.manifest_url} />
            <Alert severity="info">
              {uplinkMode === "wifi"
                ? "После прошивки и подключения к Wi‑Fi статус «онлайн» появится в списке устройств."
                : "После прошивки вставьте SIM с активным интернетом. Статус «онлайн» появится после первого heartbeat."}
            </Alert>
            <Button
              variant="contained"
              component={RouterLink}
              to={
                apiaryId != null
                  ? `/devices/${concentratorId}?apiary_id=${apiaryId}`
                  : `/devices/${concentratorId}`
              }
            >
              К базовой станции
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
