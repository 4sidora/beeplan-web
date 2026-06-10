import { useCallback, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import type { Preset } from "../utils/telemetry";

function presetRange(preset: Preset): { from: Dayjs; to: Dayjs } {
  const to = dayjs();
  switch (preset) {
    case "1h":
      return { from: to.subtract(1, "hour"), to };
    case "24h":
      return { from: to.subtract(24, "hour"), to };
    case "7d":
      return { from: to.subtract(7, "day"), to };
    case "14d":
      return { from: to.subtract(14, "day"), to };
    case "30d":
      return { from: to.subtract(30, "day"), to };
    default:
      return { from: to.subtract(1, "hour"), to };
  }
}

/** Period state for embedded charts (not synced to URL). */
export function useLocalTelemetryPeriod(initialPreset: Preset = "1h") {
  const [preset, setPresetState] = useState<Preset>(initialPreset);
  const [from, setFromState] = useState(() => presetRange(initialPreset).from);
  const [to, setToState] = useState(() => presetRange(initialPreset).to);

  const setPreset = useCallback((p: Preset) => {
    setPresetState(p);
    if (p !== "custom") {
      const range = presetRange(p);
      setFromState(range.from);
      setToState(range.to);
    }
  }, []);

  const setFrom = useCallback((v: Dayjs) => {
    setPresetState("custom");
    setFromState(v);
  }, []);

  const setTo = useCallback((v: Dayjs) => {
    setPresetState("custom");
    setToState(v);
  }, []);

  const { fromIso, toIso } = useMemo(
    () => ({
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
    }),
    [from, to],
  );

  return { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso };
}
