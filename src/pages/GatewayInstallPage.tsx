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
import { api, type Concentrator, type FirmwareBuild } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { FirmwareVersionInfo } from "../components/FirmwareVersionInfo";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { FIRMWARE_BOARDS, type FirmwareBoardId } from "../constants/boards";
import { useApiaryParam } from "../hooks/useApiaryParam";

function defaultDeviceApiUrl(): string {
  const fromEnv = import.meta.env.VITE_DEVICE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const { hostname } = window.location;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:8000`;
  }
  return import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
}

function isBadDeviceApiUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "host.docker.internal"
    );
  } catch {
    return true;
  }
}

const deviceApiUrl = defaultDeviceApiUrl();

const steps = ["Базовая станция", "Wi‑Fi и API", "Сборка", "Прошивка", "Подключение"];

export function GatewayInstallPage() {
  const { showError } = useSnackbar();
  const [apiaryId, setApiaryId] = useApiaryParam();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(deviceApiUrl);
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

  useEffect(() => {
    const fromUrl = searchParams.get("concentrator_id");
    if (fromUrl) {
      setConcentratorId(Number(fromUrl));
      setActiveStep(1);
    }
  }, [searchParams]);

  const startBuild = useMutation({
    mutationFn: () =>
      api.createFirmwareBuild({
        device_type: "gateway",
        board,
        concentrator_id: Number(concentratorId),
        wifi_ssid: wifiSsid,
        wifi_password: wifiPassword,
        api_base_url: apiBaseUrl,
      }),
    onSuccess: (result) => {
      setBuild(result);
      setActiveStep(2);
      setPolling(true);
    },
    onError: (e: Error) => showError(e.message),
  });

  const badDeviceApiUrl = isBadDeviceApiUrl(apiBaseUrl);

  const concentratorPoll = useQuery({
    queryKey: ["concentrator", concentratorId],
    queryFn: () => api.concentrator(Number(concentratorId)),
    enabled: activeStep >= 4 && concentratorId !== "",
    refetchInterval: 3000,
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

  useEffect(() => {
    if (concentratorPoll.data?.gateway_mac && activeStep === 4) {
      // already on final step
    } else if (concentratorPoll.data?.gateway_mac && activeStep === 3) {
      setActiveStep(4);
    }
  }, [concentratorPoll.data?.gateway_mac, activeStep]);

  const selectedConc = concentrators.data?.find((c) => c.id === concentratorId);

  return (
    <Box>
      <PageHeader
        title="Прошивка базовой станции"
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
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, maxWidth: 640 }}>
        <FirmwareVersionInfo
          deviceType="gateway"
          installedVersion={selectedConc?.firmware_version}
          build={build}
          compact={activeStep < 2}
        />

        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ApiarySelect value={apiaryId} onChange={setApiaryId} />
            <TextField
              select
              label="Базовая станция"
              value={concentratorId}
              onChange={(e) => setConcentratorId(Number(e.target.value))}
              fullWidth
            >
              {(concentrators.data ?? []).map((c: Concentrator) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.gateway_mac ? ` · ${c.gateway_mac}` : ""}
                </MenuItem>
              ))}
            </TextField>
            {selectedConc?.gateway_mac && (
              <Alert severity="info">
                Перепрошивка существующей базовой станции. MAC уже зарегистрирован:{" "}
                {selectedConc.gateway_mac}. После прошивки heartbeat обновит статус.
              </Alert>
            )}
            <Button
              variant="contained"
              disabled={!concentratorId}
              onClick={() => setActiveStep(1)}
            >
              Далее
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Плата (MCU)"
              value={board}
              onChange={(e) => setBoard(e.target.value as FirmwareBoardId)}
              fullWidth
              helperText="CORE-ESP32-C3 (CH343) — первый пункт. C3 с нативным USB — «нативный USB»"
            >
              {FIRMWARE_BOARDS.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.label}
                </MenuItem>
              ))}
            </TextField>
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
            <TextField
              label="URL API для устройства"
              helperText="LAN-IP вашего ПК с API (ipconfig), не localhost"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              fullWidth
              error={badDeviceApiUrl}
            />
            {badDeviceApiUrl && (
              <Alert severity="error">
                ESP32 не достучится до localhost — укажите IP ПК в Wi‑Fi сети, например{" "}
                <code>http://192.168.1.42:8000</code>
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Назад</Button>
              <Button
                variant="contained"
                disabled={!wifiSsid || !wifiPassword || startBuild.isPending || badDeviceApiUrl}
                onClick={() => startBuild.mutate()}
              >
                Собрать прошивку
              </Button>
            </Box>
          </Box>
        )}

        {activeStep >= 2 && build && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography>
              Статус сборки: <strong>{build.status}</strong>
              {selectedConc && ` · ${selectedConc.name}`}
            </Typography>
            {(build.status === "queued" || build.status === "building" || polling) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Сборка на сервере (~2–4 мин)…</Typography>
              </Box>
            )}
            {build.status === "failed" && (
              <Alert severity="error">{build.error || "Ошибка сборки"}</Alert>
            )}
            {build.status === "ready" && build.manifest_url && (
              <>
                <Alert severity="success">Прошивка готова. Подключите ESP32 и нажмите кнопку ниже.</Alert>
                <Alert severity="info">
                  Для монитора в Arduino IDE закройте вкладку после прошивки (COM-порт занят WebSerial).
                </Alert>
                <EspWebInstallButton manifestUrl={build.manifest_url} />
                <Button variant="outlined" onClick={() => setActiveStep(4)}>
                  Я прошил — жду heartbeat
                </Button>
              </>
            )}
            {activeStep >= 4 && (
              <>
                {concentratorPoll.data?.gateway_mac ? (
                  <Alert severity="success">
                    Базовая станция зарегистрирована: MAC {concentratorPoll.data.gateway_mac}
                  </Alert>
                ) : (
                  <Alert severity="info">
                    Ожидание heartbeat от базовой станции после прошивки и подключения к Wi‑Fi…
                  </Alert>
                )}
                <Button
                  variant="contained"
                  component={RouterLink}
                  to={`/devices/install/edge?concentrator_id=${concentratorId}`}
                  disabled={!concentratorPoll.data?.gateway_mac}
                >
                  Прошить улей
                </Button>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
