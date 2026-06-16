import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api, type FirmwareBuild } from "../api";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { FirmwareBuildProgress } from "../components/FirmwareBuildProgress";
import { FirmwareVersionInfo } from "../components/FirmwareVersionInfo";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { EdgeProductTypePicker } from "../components/EdgeProductTypePicker";
import { FirmwareBoardPicker } from "../components/FirmwareBoardPicker";
import type { FirmwareBoardId } from "../constants/boards";
import { boardById, defaultBoardForProfile } from "../constants/boards";
import {
  type EdgeProductTypeId,
  edgeProductTypeById,
} from "../constants/edgeProductTypes";
import { useApiaryParam } from "../hooks/useApiaryParam";

const steps = ["Тип устройства", "Плата", "Параметры", "Сборка", "Прошивка"];

function parseEdgeDeviceId(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("edge_device_id");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function EdgeInstallPage() {
  const { showError } = useSnackbar();
  const [searchParams] = useSearchParams();
  const [apiaryId, setApiaryId] = useApiaryParam();
  const edgeDeviceId = useMemo(() => parseEdgeDeviceId(searchParams), [searchParams]);

  const [activeStep, setActiveStep] = useState(0);
  const [productType, setProductType] = useState<EdgeProductTypeId>("multisensor");
  const [wakeInterval, setWakeInterval] = useState(3600);
  const [debugSerial, setDebugSerial] = useState(true);
  const [board, setBoard] = useState<FirmwareBoardId>(() => defaultBoardForProfile("edge"));
  const [build, setBuild] = useState<FirmwareBuild | null>(null);
  const [polling, setPolling] = useState(false);

  const selectedProduct = edgeProductTypeById(productType);
  const firmwareReady = selectedProduct?.firmwareAvailable ?? false;
  const selectedBoard = boardById(board);
  const boardReady = selectedBoard?.firmwareAvailable ?? false;

  const device = useQuery({
    queryKey: ["edge-device", edgeDeviceId],
    queryFn: () => api.edgeDevice(edgeDeviceId!),
    enabled: edgeDeviceId != null,
  });

  const concentratorId = device.data?.concentrator_id ?? null;

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

  useEffect(() => {
    if (device.data?.wake_interval_sec != null) {
      setWakeInterval(device.data.wake_interval_sec);
    }
  }, [device.data?.wake_interval_sec]);

  const gatewayReady = Boolean(concentrator.data?.gateway_mac);
  const channelReady = concentrator.data?.wifi_channel != null;
  const slotEnsureAttempted = useRef(false);

  const ensureTelemetrySlot = useMutation({
    mutationFn: () => api.ensureEdgeTelemetrySlot(edgeDeviceId!),
    onSuccess: () => device.refetch(),
    onError: (e: Error) => showError(e.message),
  });

  useEffect(() => {
    if (activeStep !== 2) {
      slotEnsureAttempted.current = false;
      return;
    }
    if (edgeDeviceId == null || device.isLoading || device.data?.telemetry_slot_sec != null) {
      return;
    }
    if (slotEnsureAttempted.current || ensureTelemetrySlot.isPending) {
      return;
    }
    slotEnsureAttempted.current = true;
    ensureTelemetrySlot.mutate();
  }, [
    activeStep,
    edgeDeviceId,
    device.isLoading,
    device.data?.telemetry_slot_sec,
    ensureTelemetrySlot.isPending,
    ensureTelemetrySlot,
  ]);

  const startBuild = useMutation({
    mutationFn: () =>
      api.createFirmwareBuild({
        device_type: "edge",
        board,
        concentrator_id: concentratorId!,
        edge_device_id: edgeDeviceId!,
        wake_interval_sec: wakeInterval,
        debug_serial: debugSerial,
      }),
    onSuccess: (result) => {
      setBuild(result);
      setActiveStep(3);
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
          setActiveStep(4);
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

  const edge = device.data;
  const deviceTitle = edge ? edge.name || edge.public_id : "";

  const edgeDetailUrl =
    edgeDeviceId != null
      ? apiaryId != null
        ? `/devices/edge/${edgeDeviceId}?apiary_id=${apiaryId}`
        : `/devices/edge/${edgeDeviceId}`
      : "/devices";

  if (edgeDeviceId == null) {
    return (
      <Box>
        <PageHeader title="Прошивка устройства сбора данных" />
        <Alert severity="warning" sx={{ mb: 2 }}>
          Укажите устройство: откройте прошивку из карточки устройства (кнопка «Перепрошить») или
          списка подключённых устройств базовой станции.
        </Alert>
        <Button variant="contained" component={RouterLink} to="/devices">
          К устройствам
        </Button>
      </Box>
    );
  }

  if (device.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (device.isError || !edge) {
    return (
      <Box>
        <PageHeader title="Прошивка устройства сбора данных" />
        <Alert severity="error" sx={{ mb: 2 }}>
          Устройство не найдено или нет доступа.
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
        title="Прошивка устройства сбора данных"
        actions={
          <Button
            component={RouterLink}
            to={
              concentratorId != null
                ? apiaryId != null
                  ? `/devices/${concentratorId}?apiary_id=${apiaryId}`
                  : `/devices/${concentratorId}`
                : apiaryId != null
                  ? `/devices?apiary_id=${apiaryId}`
                  : "/devices"
            }
            size="small"
          >
            К базовой станции
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

      <Paper sx={{ p: 3, maxWidth: activeStep === 1 ? 1040 : activeStep === 0 ? 720 : 640 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {deviceTitle}
        </Typography>

        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <EdgeProductTypePicker value={productType} onChange={setProductType} />

            {firmwareReady ? (
              <FirmwareVersionInfo
                deviceType="edge"
                installedVersion={edge.firmware_version}
                installOverview
                description={selectedProduct?.capabilities}
              />
            ) : (
              <Alert severity="info" sx={{ mb: 2, "& .MuiAlert-message": { width: "100%" } }}>
                <Typography
                  component="div"
                  variant="subtitle1"
                  sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1 }}
                >
                  Версия прошивки
                </Typography>
                <Typography variant="body2">
                  Прошивка для «{selectedProduct?.label}» пока в разработке. Выберите другой тип
                  устройства, чтобы продолжить.
                </Typography>
              </Alert>
            )}

            <Button variant="contained" disabled={!firmwareReady} onClick={() => setActiveStep(1)}>
              Далее
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {!gatewayReady && (
              <Alert severity="warning">
                Сначала{" "}
                <RouterLink
                  to={`/devices/install/gateway?concentrator_id=${concentratorId}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`}
                >
                  прошейте базовую станцию
                </RouterLink>
                , чтобы зарегистрировать MAC.
              </Alert>
            )}
            {gatewayReady && !channelReady && (
              <Alert severity="warning">
                Базовая станция ещё не сообщила Wi‑Fi канал. Подключите gateway к интернету и
                дождитесь heartbeat (канал появится после первого выхода в сеть).
              </Alert>
            )}
            <FirmwareBoardPicker
              profile="edge"
              value={board}
              onChange={setBoard}
              deviceType="edge"
              installedVersion={edge.firmware_version}
              showFirmwareVersion={false}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Назад</Button>
              <Button
                variant="contained"
                disabled={!gatewayReady || !channelReady || !boardReady}
                onClick={() => setActiveStep(2)}
              >
                Далее
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Интервал замера (сек)"
              type="number"
              value={wakeInterval}
              onChange={(e) => setWakeInterval(Number(e.target.value))}
              fullWidth
              helperText="По умолчанию 3600 с (раз в час). TDMA-слот назначается автоматически."
            />
            <TextField
              label="TDMA-слот (сек)"
              value={
                ensureTelemetrySlot.isPending
                  ? "…"
                  : device.data?.telemetry_slot_sec ?? edge.telemetry_slot_sec ?? "—"
              }
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="Смещение внутри часа; назначается сервером автоматически"
            />
            <TextField
              label="Wi‑Fi канал базовой станции"
              value={concentrator.data?.wifi_channel ?? "—"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <FormControlLabel
              control={
                <Checkbox checked={debugSerial} onChange={(e) => setDebugSerial(e.target.checked)} />
              }
              label="Отладочный UART-лог (рекомендуется при настройке)"
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(1)}>Назад</Button>
              <Button
                variant="contained"
                disabled={!gatewayReady || !channelReady || startBuild.isPending}
                onClick={() => startBuild.mutate()}
              >
                Собрать прошивку
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 3 && build && (
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
                <FirmwareBuildProgress build={build} deviceType="edge" />
              </Box>
            )}
            {build.status === "failed" && (
              <>
                <Alert severity="error">{build.error || "Ошибка сборки"}</Alert>
                <Button variant="outlined" onClick={() => setActiveStep(2)}>
                  Вернуться к параметрам
                </Button>
              </>
            )}
          </Box>
        )}

        {activeStep === 4 && build?.status === "ready" && build.manifest_url && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="success">
              Прошивка готова. Подключите устройство по USB (Chrome/Edge на ПК).
            </Alert>
            <Alert severity="warning">
              Edge уходит в deep sleep через несколько секунд после пробуждения — WebSerial
              не успеет подключиться без подготовки. Перед INSTALL:
              <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                <li>Закройте монитор порта на других вкладках (тот же COM-порт).</li>
                <li>Отключите другие ESP по USB — оставьте только это устройство.</li>
                <li>
                  Зажмите <strong>BOOT</strong> (PRG), нажмите <strong>RST</strong>, отпустите RST.
                </li>
                <li>
                  Не отпуская BOOT, нажмите INSTALL и выберите COM-порт; отпустите BOOT, когда
                  появится «Preparing installation…».
                </li>
              </Box>
              На T-Energy: переключатель BAT — ON, кабель с передачей данных (не только зарядка).
            </Alert>
            <EspWebInstallButton manifestUrl={build.manifest_url} />
            <Alert severity="info">
              После прошивки статус «онлайн» появится в карточке устройства.
            </Alert>
            <Button variant="contained" component={RouterLink} to={edgeDetailUrl}>
              К устройству
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
