import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useQueries, useQuery } from "@tanstack/react-query";
import "dayjs/locale/ru";
import { useEffect, useMemo } from "react";
import { api, type Colony } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { TelemetryChart } from "../components/TelemetryChart";
import { useApiaryParam } from "../hooks/useApiaryParam";
import { useTelemetryPeriod, useTelemetryViewParams } from "../hooks/useTelemetryParams";
import { mergeColonySeries, pointsToSingleSeries } from "../utils/telemetry";

export function TelemetryPage() {
  const [apiaryId, setApiaryId] = useApiaryParam();
  const { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso } = useTelemetryPeriod();

  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });
  useEffect(() => {
    if (apiaryId == null && apiaries.data?.[0]) {
      setApiaryId(apiaries.data[0].id);
    }
  }, [apiaryId, apiaries.data, setApiaryId]);

  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const colonyIds = useMemo(() => (colonies.data ?? []).map((c) => c.id), [colonies.data]);

  const {
    mode,
    setMode,
    colonyId,
    setColonyId,
    selectedColonyIds,
    toggleColonyId,
  } = useTelemetryViewParams(colonyIds);

  useEffect(() => {
    if (mode !== "single" || colonyIds.length === 0) return;
    const raw = new URLSearchParams(window.location.search).get("colony_id");
    const parsed = raw ? Number(raw) : null;
    if (parsed == null || !colonyIds.includes(parsed)) {
      setColonyId(colonyIds[0] ?? null);
    }
  }, [mode, colonyIds, setColonyId]);

  const targetColonies: Colony[] = useMemo(() => {
    const list = colonies.data ?? [];
    if (mode === "single" && colonyId != null) {
      return list.filter((c) => c.id === colonyId);
    }
    if (mode === "all") return list;
    if (mode === "selected") return list.filter((c) => selectedColonyIds.includes(c.id));
    return [];
  }, [colonies.data, mode, colonyId, selectedColonyIds]);

  const tempQueries = useQueries({
    queries: targetColonies.map((c) => ({
      queryKey: ["telemetry", c.id, "temperature_c", fromIso, toIso],
      queryFn: () =>
        api.telemetry(c.id, { metric: "temperature_c", from: fromIso, to: toIso, limit: 5000 }),
      enabled: targetColonies.length > 0,
    })),
  });

  const humQueries = useQueries({
    queries: targetColonies.map((c) => ({
      queryKey: ["telemetry", c.id, "relative_humidity", fromIso, toIso],
      queryFn: () =>
        api.telemetry(c.id, { metric: "relative_humidity", from: fromIso, to: toIso, limit: 5000 }),
      enabled: targetColonies.length > 0,
    })),
  });

  const loading = tempQueries.some((q) => q.isLoading) || humQueries.some((q) => q.isLoading);
  const error = tempQueries.find((q) => q.error)?.error ?? humQueries.find((q) => q.error)?.error;

  const isMulti = mode !== "single";

  const tempChart = useMemo(() => {
    if (targetColonies.length === 0) return { single: [], multi: { data: [], keys: [] } };
    if (!isMulti) {
      return {
        single: pointsToSingleSeries(tempQueries[0]?.data ?? [], "temperature_c", "temperature"),
        multi: { data: [], keys: [] },
      };
    }
    const series = targetColonies.map((c, i) => ({
      colonyId: c.id,
      name: c.name,
      points: tempQueries[i]?.data ?? [],
    }));
    return { single: [], multi: mergeColonySeries(series, "temperature_c") };
  }, [targetColonies, tempQueries, isMulti]);

  const humChart = useMemo(() => {
    if (targetColonies.length === 0) return { single: [], multi: { data: [], keys: [] } };
    if (!isMulti) {
      return {
        single: pointsToSingleSeries(humQueries[0]?.data ?? [], "relative_humidity", "humidity"),
        multi: { data: [], keys: [] },
      };
    }
    const series = targetColonies.map((c, i) => ({
      colonyId: c.id,
      name: c.name,
      points: humQueries[i]?.data ?? [],
    }));
    return { single: [], multi: mergeColonySeries(series, "relative_humidity") };
  }, [targetColonies, humQueries, isMulti]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <PageHeader title="Телеметрия">
        <ApiarySelect value={apiaryId} onChange={setApiaryId} />
      </PageHeader>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Режим просмотра
        </Typography>
        <RadioGroup
          row
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
        >
          <FormControlLabel value="single" control={<Radio size="small" />} label="Одна семья" />
          <FormControlLabel value="all" control={<Radio size="small" />} label="Все семьи пасеки" />
          <FormControlLabel value="selected" control={<Radio size="small" />} label="Выбранные семьи" />
        </RadioGroup>

        {mode === "single" && (
          <FormControl size="small" sx={{ minWidth: 220, mt: 1 }} disabled={!colonies.data?.length}>
            <InputLabel id="colony-tel-label">Семья</InputLabel>
            <Select
              labelId="colony-tel-label"
              label="Семья"
              value={colonyId ?? ""}
              onChange={(e) => setColonyId(Number(e.target.value))}
            >
              {(colonies.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {mode === "selected" && (
          <FormGroup row sx={{ mt: 1 }}>
            {(colonies.data ?? []).map((c) => (
              <FormControlLabel
                key={c.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedColonyIds.includes(c.id)}
                    onChange={() => toggleColonyId(c.id)}
                  />
                }
                label={c.name}
              />
            ))}
          </FormGroup>
        )}

        {mode === "all" && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Сводный график по {(colonies.data ?? []).length} семьям
          </Typography>
        )}
      </Paper>

      <PeriodSelector
        preset={preset}
        onPresetChange={setPreset}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      {apiaryId == null ? (
        <Typography color="text.secondary">Выберите пасеку.</Typography>
      ) : targetColonies.length === 0 ? (
        <Typography color="text.secondary">Выберите семьи для отображения.</Typography>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{String((error as Error).message)}</Typography>
      ) : isMulti ? (
        <>
          <TelemetryChart
            variant="multi"
            title="Температура — сводный график"
            data={tempChart.multi.data}
            series={tempChart.multi.keys.map((k) => ({ dataKey: k.dataKey, name: k.name }))}
            periodFrom={fromIso}
            periodTo={toIso}
          />
          <TelemetryChart
            variant="multi"
            title="Влажность — сводный график"
            data={humChart.multi.data}
            series={humChart.multi.keys.map((k) => ({ dataKey: k.dataKey, name: k.name }))}
            periodFrom={fromIso}
            periodTo={toIso}
          />
        </>
      ) : (
        <>
          <TelemetryChart
            variant="single"
            title="Температура"
            data={tempChart.single}
            dataKey="temperature"
            unit="°C"
            periodFrom={fromIso}
            periodTo={toIso}
          />
          <TelemetryChart
            variant="single"
            title="Влажность"
            data={humChart.single}
            dataKey="humidity"
            unit="%"
            color="#5D4037"
            periodFrom={fromIso}
            periodTo={toIso}
          />
        </>
      )}
    </LocalizationProvider>
  );
}
