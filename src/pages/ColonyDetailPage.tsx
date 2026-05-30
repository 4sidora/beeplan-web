import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQuery } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { Link as RouterLink, useParams } from "react-router-dom";
import { api } from "../api";
import { ColonyDevicesSection } from "../components/ColonyDevicesSection";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { TelemetryChart } from "../components/TelemetryChart";
import { useLocalTelemetryPeriod } from "../hooks/useLocalTelemetryPeriod";
import {
  colonyTypeLabel,
  formatHiveDetails,
  hiveTypeLabel,
} from "../utils/colonyCatalog";
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

  const apiaries = useQuery({
    queryKey: ["apiaries"],
    queryFn: api.apiaries,
  });

  const apiaryName =
    apiaries.data?.find((a) => a.id === apiaryId)?.name ?? (apiaryId != null ? `ID ${apiaryId}` : "—");

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
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Параметры семьи
          </Typography>
          <Grid container spacing={2}>
            <ParamRow label="Название" value={c.name} />
            <ParamRow label="Пасека" value={apiaryName} />
            <ParamRow label="Порода" value={c.bee_breed ?? "—"} />
            <ParamRow label="Тип семьи" value={colonyTypeLabel(c.colony_type)} />
            <ParamRow label="Тип улья" value={hiveTypeLabel(c.hive_type)} />
            <ParamRow
              label="Улей"
              value={formatHiveDetails(
                c.hive_type,
                c.body_count,
                c.frames_per_body,
                c.hive_volume_m3,
              )}
            />
            {c.description ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Описание
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {c.description}
                </Typography>
              </Grid>
            ) : null}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            ID семьи: {c.id}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button size="small" component={RouterLink} to={`/colonies?apiary_id=${c.apiary_id}`}>
              К списку семей
            </Button>
          </Box>
        </CardContent>
      </Card>

      {apiaryId != null && (
        <ColonyDevicesSection colonyId={colonyId} apiaryId={apiaryId} showTitle />
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
