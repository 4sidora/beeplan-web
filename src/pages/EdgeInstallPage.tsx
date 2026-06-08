import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
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
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { api, type FirmwareBuild } from "../api";
import { EspWebInstallButton, isWebSerialSupported } from "../components/EspWebInstallButton";
import { FirmwareBuildProgress } from "../components/FirmwareBuildProgress";
import { FirmwareVersionInfo } from "../components/FirmwareVersionInfo";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { FIRMWARE_BOARDS, type FirmwareBoardId } from "../constants/boards";
import {
  EDGE_PRODUCT_TYPES,
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
  const [board, setBoard] = useState<FirmwareBoardId>("esp32dev");
  const [build, setBuild] = useState<FirmwareBuild | null>(null);
  const [polling, setPolling] = useState(false);

  const selectedProduct = edgeProductTypeById(productType);
  const firmwareReady = selectedProduct?.firmwareAvailable ?? false;

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

  const gatewayReady = Boolean(concentrator.data?.gateway_mac);
  const channelReady = concentrator.data?.wifi_channel != null;

  const startBuild = useMutation({
    mutationFn: () =>
      api.createFirmwareBuild({
        device_type: "edge",
        board,
        concentrator_id: concentratorId!,
        edge_device_id: edgeDeviceId!,
        wake_interval_sec: wakeInterval,
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

      <Paper sx={{ p: 3, maxWidth: 640 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {deviceTitle}
        </Typography>

        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl>
              <FormLabel id="edge-product-type-label">Тип устройства</FormLabel>
              <RadioGroup
                aria-labelledby="edge-product-type-label"
                value={productType}
                onChange={(e) => setProductType(e.target.value as EdgeProductTypeId)}
              >
                {EDGE_PRODUCT_TYPES.map((t) => (
                  <FormControlLabel
                    key={t.id}
                    value={t.id}
                    control={<Radio />}
                    label={t.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>

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
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Прошивка для «{selectedProduct?.label}» пока в разработке. Выберите другой тип
                  устройства, чтобы продолжить.
                </Typography>
                {selectedProduct?.capabilities ? (
                  <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                    {selectedProduct.capabilities}
                  </Typography>
                ) : null}
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
            <TextField
              select
              label="Плата (MCU)"
              value={board}
              onChange={(e) => setBoard(e.target.value as FirmwareBoardId)}
              fullWidth
            >
              {FIRMWARE_BOARDS.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.label}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Назад</Button>
              <Button variant="contained" disabled={!gatewayReady || !channelReady} onClick={() => setActiveStep(2)}>
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
              value={edge.telemetry_slot_sec ?? "—"}
              fullWidth
              InputProps={{ readOnly: true }}
              helperText="Смещение внутри часа; назначается при создании устройства"
            />
            <TextField
              label="Wi‑Fi канал базовой станции"
              value={concentrator.data?.wifi_channel ?? "—"}
              fullWidth
              InputProps={{ readOnly: true }}
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
              Прошивка готова. Подключите ESP32 и нажмите кнопку ниже.
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
