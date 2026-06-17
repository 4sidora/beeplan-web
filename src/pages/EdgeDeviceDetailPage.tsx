import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQuery } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { api } from "../api";
import { DetailStickyHeader } from "../components/DetailStickyHeader";
import { DeviceStatusCharts } from "../components/DeviceStatusCharts";
import { PeriodSelector } from "../components/PeriodSelector";
import { TelemetryChart } from "../components/TelemetryChart";
import { useLocalTelemetryPeriod } from "../hooks/useLocalTelemetryPeriod";
import { formatDateTime } from "../utils/formatDateTime";
import { formatLastSeen } from "../utils/formatLastSeen";
import { formatTelemetryValue } from "../utils/formatTelemetryValue";
import { metricLabel } from "../utils/metricLabels";
import { formatTelemetrySlot, formatWakeInterval } from "../utils/edgeTiming";
import { pivotTelemetryByTime, pointsToSingleSeries } from "../utils/telemetry";
import { toUserFacingError } from "../utils/userFacingError";

function ParamRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  );
}

export function EdgeDeviceDetailPage() {
  const { deviceId: rawId } = useParams();
  const deviceId = rawId ? Number(rawId) : NaN;
  const { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso } = useLocalTelemetryPeriod();

  const device = useQuery({
    queryKey: ["edge-device", deviceId],
    queryFn: () => api.edgeDevice(deviceId),
    enabled: Number.isFinite(deviceId),
    refetchInterval: 60_000,
  });

  const concentratorId = device.data?.concentrator_id;
  const colonyId = device.data?.current_colony_id ?? null;

  const concentrator = useQuery({
    queryKey: ["concentrator", concentratorId],
    queryFn: () => api.concentrator(concentratorId!),
    enabled: concentratorId != null,
  });

  const colony = useQuery({
    queryKey: ["colony", colonyId],
    queryFn: () => api.colony(colonyId!),
    enabled: colonyId != null,
  });

  const telemetry = useQuery({
    queryKey: ["edge-device-telemetry", deviceId, fromIso, toIso],
    queryFn: () =>
      api.edgeDeviceTelemetry(deviceId, { from: fromIso, to: toIso, limit: 5000 }),
    enabled: Number.isFinite(deviceId),
  });

  const telemetryPoints = telemetry.data ?? [];
  const tempPoints = useMemo(
    () => telemetryPoints.filter((p) => p.metric === "temperature_c"),
    [telemetryPoints],
  );
  const humPoints = useMemo(
    () => telemetryPoints.filter((p) => p.metric === "relative_humidity"),
    [telemetryPoints],
  );
  const signalPoints = useMemo(
    () => telemetryPoints.filter((p) => p.metric === "signal_level"),
    [telemetryPoints],
  );
  const batteryPoints = useMemo(
    () => telemetryPoints.filter((p) => p.metric === "battery_voltage"),
    [telemetryPoints],
  );

  const telemetryTable = useMemo(
    () => pivotTelemetryByTime(telemetryPoints),
    [telemetryPoints],
  );

  if (!Number.isFinite(deviceId)) {
    return <Typography color="error">Некорректный ID устройства</Typography>;
  }

  const d = device.data;
  const apiaryId = concentrator.data?.apiary_id;
  const title = d?.name || d?.public_id || "Устройство";
  const backToConc = concentratorId != null ? `/devices/${concentratorId}` : "/devices";
  const flashUrl = d
    ? `/devices/install/edge?edge_device_id=${d.id}&concentrator_id=${d.concentrator_id}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`
    : "#";

  const tempChart = pointsToSingleSeries(tempPoints, "temperature_c", "temperature");
  const humChart = pointsToSingleSeries(humPoints, "relative_humidity", "humidity");

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <DetailStickyHeader
        backTo={backToConc}
        backLabel="К базовой станции"
        title={title}
        lastSeenAt={d?.last_seen_at}
        wakeIntervalSec={d?.wake_interval_sec ?? 3600}
        recentTelemetry={
          d
            ? [...signalPoints, ...batteryPoints, ...(d.recent_telemetry ?? [])]
            : undefined
        }
        secondaryActions={
          d ? [{ label: "Перепрошить", to: flashUrl, variant: "outlined" }] : []
        }
        primaryAction={{
          label: "Редактировать",
          to: d ? `/devices/edge/${d.id}/edit` : "#",
          variant: "contained",
        }}
      />

      {device.isError ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {toUserFacingError(device.error, "Не удалось загрузить устройство")}
        </Typography>
      ) : null}

      {device.isLoading && !d ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !d ? (
        <Typography color="text.secondary">Устройство не найдено</Typography>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
            <ParamRow
              label="Public ID"
              value={
                <Typography component="span" sx={{ fontFamily: "monospace", fontSize: 14 }}>
                  {d.public_id}
                </Typography>
              }
            />
            <ParamRow label="Прошивка" value={d.firmware_version ?? "—"} />
            <ParamRow
              label="Интервал замера"
              value={
                d.wake_interval_sec != null
                  ? formatWakeInterval(d.wake_interval_sec)
                  : "—"
              }
            />
            <ParamRow
              label="TDMA-слот"
              value={formatTelemetrySlot(d.telemetry_slot_sec, d.wake_interval_sec)}
            />
            <ParamRow
              label="Wi‑Fi канал"
              value={
                concentrator.data?.wifi_channel != null
                  ? String(concentrator.data.wifi_channel)
                  : "—"
              }
            />
            <ParamRow label="Последний контакт" value={formatLastSeen(d.last_seen_at)} />
            <ParamRow
              label="Базовая станция"
              value={
                concentratorId != null ? (
                  <Button component={RouterLink} to={`/devices/${concentratorId}`} size="small">
                    {d.concentrator_name ?? `#${concentratorId}`}
                  </Button>
                ) : (
                  "—"
                )
              }
            />
            <ParamRow
              label="Семья"
              value={
                colonyId != null && colony.data ? (
                  <Button
                    component={RouterLink}
                    to={`/colonies/${colonyId}?apiary_id=${colony.data.apiary_id}`}
                    size="small"
                  >
                    {colony.data.name}
                  </Button>
                ) : (
                  "Не привязано"
                )
              }
            />
                </Grid>
              </CardContent>
            </Card>
          </Box>

          <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      <Typography variant="h6" sx={{ mb: 1 }}>
        Датчики улья
      </Typography>
      {telemetry.isLoading ? (
        <CircularProgress sx={{ mb: 3 }} />
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TelemetryChart
              variant="single"
              title="Температура"
              data={tempChart}
              dataKey="temperature"
              unit="°C"
              periodFrom={fromIso}
              periodTo={toIso}
              wakeIntervalSec={d.wake_interval_sec ?? 3600}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TelemetryChart
              variant="single"
              title="Влажность"
              data={humChart}
              dataKey="humidity"
              unit="%"
              color="#5D4037"
              periodFrom={fromIso}
              periodTo={toIso}
              wakeIntervalSec={d.wake_interval_sec ?? 3600}
            />
          </Grid>
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 1 }}>
        Состояние устройства
      </Typography>
      <DeviceStatusCharts
        signalPoints={signalPoints}
        batteryPoints={batteryPoints}
        loading={telemetry.isLoading}
        periodFrom={fromIso}
        periodTo={toIso}
        wakeIntervalSec={d.wake_interval_sec ?? 3600}
      />

      <Typography variant="h6" gutterBottom>
        Все записи за период
      </Typography>
      {telemetry.isLoading ? (
        <CircularProgress size={24} />
      ) : telemetryTable.rows.length === 0 ? (
        <Typography color="text.secondary">Нет данных за выбранный период.</Typography>
      ) : (
        <Paper variant="outlined">
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>Время</TableCell>
                  {telemetryTable.metrics.map((metric) => (
                    <TableCell key={metric} sx={{ whiteSpace: "nowrap" }}>
                      {metricLabel(metric)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {telemetryTable.rows.map((row) => (
                  <TableRow key={row.ts}>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 500 }}>
                      {formatDateTime(row.ts)}
                    </TableCell>
                    {telemetryTable.metrics.map((metric) => {
                      const value = row.values[metric];
                      return (
                        <TableCell key={metric}>
                          {value != null ? formatTelemetryValue(metric, value) : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
        </>
      )}
    </LocalizationProvider>
  );
}
