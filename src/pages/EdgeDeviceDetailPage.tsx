import type { ReactNode } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQuery } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { Link as RouterLink, useParams } from "react-router-dom";
import { api } from "../api";
import { ObjectCardHeader } from "../components/ObjectCardHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { TelemetryChart } from "../components/TelemetryChart";
import { useLocalTelemetryPeriod } from "../hooks/useLocalTelemetryPeriod";
import { formatLastSeen } from "../utils/formatLastSeen";
import { formatTelemetryValue } from "../utils/formatTelemetryValue";
import { pointsToSingleSeries } from "../utils/telemetry";

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
  const { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso } = useLocalTelemetryPeriod("14d");

  const device = useQuery({
    queryKey: ["edge-device", deviceId],
    queryFn: () => api.edgeDevice(deviceId),
    enabled: Number.isFinite(deviceId),
    refetchInterval: 30_000,
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

  const tempQuery = useQuery({
    queryKey: ["edge-device-telemetry", deviceId, "temperature_c", fromIso, toIso],
    queryFn: () =>
      api.edgeDeviceTelemetry(deviceId, {
        metric: "temperature_c",
        from: fromIso,
        to: toIso,
        limit: 5000,
      }),
    enabled: Number.isFinite(deviceId),
  });

  const humQuery = useQuery({
    queryKey: ["edge-device-telemetry", deviceId, "relative_humidity", fromIso, toIso],
    queryFn: () =>
      api.edgeDeviceTelemetry(deviceId, {
        metric: "relative_humidity",
        from: fromIso,
        to: toIso,
        limit: 5000,
      }),
    enabled: Number.isFinite(deviceId),
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
  const apiaryId = concentrator.data?.apiary_id;
  const title = d.name || d.public_id;
  const backToConc = concentratorId != null ? `/devices/${concentratorId}` : "/devices";
  const flashUrl = `/devices/install/edge?edge_device_id=${d.id}&concentrator_id=${d.concentrator_id}${apiaryId != null ? `&apiary_id=${apiaryId}` : ""}`;

  const tempChart = pointsToSingleSeries(tempQuery.data ?? [], "temperature_c", "temperature");
  const humChart = pointsToSingleSeries(humQuery.data ?? [], "relative_humidity", "humidity");
  const tableRows = [...(telemetry.data ?? [])].reverse();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Button component={RouterLink} to={backToConc} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        К базовой станции
      </Button>

      <Box sx={{ mb: 3 }}>
        <ObjectCardHeader
          title={title}
          titleVariant="h5"
          lastSeenAt={d.last_seen_at}
          secondaryActions={[{ label: "Перепрошить", to: flashUrl, variant: "outlined" }]}
          primaryAction={{
            label: "Редактировать",
            to: `/devices/edge/${d.id}/edit`,
            variant: "contained",
          }}
        />
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

      {tempQuery.isLoading || humQuery.isLoading ? (
        <CircularProgress sx={{ mb: 3 }} />
      ) : (
        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TelemetryChart
              variant="single"
              title="Температура"
              data={tempChart}
              dataKey="temperature"
              unit="°C"
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
            />
          </Grid>
        </Grid>
      )}

      <Typography variant="h6" gutterBottom>
        Все записи за период
      </Typography>
      {telemetry.isLoading ? (
        <CircularProgress size={24} />
      ) : tableRows.length === 0 ? (
        <Typography color="text.secondary">Нет данных за выбранный период.</Typography>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Время</TableCell>
                <TableCell>Метрика</TableCell>
                <TableCell>Значение</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row, i) => (
                <TableRow key={`${row.ts}-${row.metric}-${i}`}>
                  <TableCell>{new Date(row.ts).toLocaleString()}</TableCell>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell>{formatTelemetryValue(row.metric, row.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </LocalizationProvider>
  );
}
