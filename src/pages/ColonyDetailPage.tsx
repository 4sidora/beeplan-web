import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import DevicesOtherIcon from "@mui/icons-material/DevicesOther";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQuery } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { Link as RouterLink, useParams } from "react-router-dom";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { TelemetryChart } from "../components/TelemetryChart";
import { useLocalTelemetryPeriod } from "../hooks/useLocalTelemetryPeriod";
import { pointsToSingleSeries } from "../utils/telemetry";

export function ColonyDetailPage() {
  const { colonyId: rawId } = useParams();
  const colonyId = rawId ? Number(rawId) : NaN;
  const { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso } = useLocalTelemetryPeriod("14d");

  const colony = useQuery({
    queryKey: ["colony", colonyId],
    queryFn: () => api.colony(colonyId),
    enabled: Number.isFinite(colonyId),
  });

  const apiaryId = colony.data?.apiary_id ?? null;

  const devices = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId!),
    enabled: apiaryId != null,
  });

  const colonyDevices = (devices.data ?? []).filter((d) => d.current_colony_id === colonyId);

  const tempQuery = useQuery({
    queryKey: ["telemetry", colonyId, "temperature_c", fromIso, toIso],
    queryFn: () =>
      api.telemetry(colonyId, { metric: "temperature_c", from: fromIso, to: toIso, limit: 5000 }),
    enabled: Number.isFinite(colonyId),
  });

  const humQuery = useQuery({
    queryKey: ["telemetry", colonyId, "relative_humidity", fromIso, toIso],
    queryFn: () =>
      api.telemetry(colonyId, { metric: "relative_humidity", from: fromIso, to: toIso, limit: 5000 }),
    enabled: Number.isFinite(colonyId),
  });

  const tempChart = pointsToSingleSeries(tempQuery.data ?? [], "temperature_c", "temperature");
  const humChart = pointsToSingleSeries(humQuery.data ?? [], "relative_humidity", "humidity");

  if (colony.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (colony.isError || !colony.data) {
    return <Typography color="error">Семья не найдена</Typography>;
  }

  const c = colony.data;
  const editPath = `/colonies/${c.id}/edit?apiary_id=${c.apiary_id}`;
  const devicesPath = `/colonies/${c.id}/devices?apiary_id=${c.apiary_id}`;
  const telemetryPath = `/telemetry?apiary_id=${c.apiary_id}&mode=single&colony_id=${c.id}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <PageHeader
        title={c.name}
        actions={
          <Button component={RouterLink} to={editPath} variant="contained" startIcon={<EditIcon />}>
            Редактировать
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">
            Параметры семьи
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>ID:</strong> {c.id}
          </Typography>
          <Typography variant="body1">
            <strong>Порода:</strong> {c.bee_breed ?? "—"}
          </Typography>
          <Typography variant="body1">
            <strong>Пасека ID:</strong> {c.apiary_id}
          </Typography>
          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button size="small" component={RouterLink} to={devicesPath} startIcon={<DevicesOtherIcon />}>
              Устройства семьи
            </Button>
            <Button size="small" component={RouterLink} to={telemetryPath}>
              Телеметрия семьи
            </Button>
            <Button size="small" component={RouterLink} to={`/colonies?apiary_id=${c.apiary_id}`}>
              К списку семей
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Подключённые устройства
      </Typography>
      {colonyDevices.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Нет привязанных устройств.{" "}
          <RouterLink to={devicesPath}>Добавить или привязать устройство</RouterLink>
        </Typography>
      ) : (
        <Paper sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Public ID</TableCell>
                <TableCell>Метка</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {colonyDevices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>{d.public_id}</TableCell>
                  <TableCell>{d.label ?? "—"}</TableCell>
                  <TableCell>Привязано</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ p: 1.5 }}>
            <Button size="small" component={RouterLink} to={devicesPath}>
              Управление устройствами
            </Button>
          </Box>
        </Paper>
      )}

      <Typography variant="h6" gutterBottom>
        Телеметрия
      </Typography>
      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      {tempQuery.isLoading || humQuery.isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <TelemetryChart
            variant="single"
            title="Температура"
            data={tempChart}
            dataKey="temperature"
            unit="°C"
          />
          <TelemetryChart
            variant="single"
            title="Влажность"
            data={humChart}
            dataKey="humidity"
            unit="%"
            color="#5D4037"
          />
        </>
      )}
    </LocalizationProvider>
  );
}
