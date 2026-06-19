import { useCallback, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  DEFAULT_TELEMETRY_PRESET,
  loadStoredTelemetryPeriod,
  saveStoredTelemetryPeriod,
} from "./telemetryPeriodStorage";
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
      return { from: to.subtract(24, "hour"), to };
  }
}

function initialState() {
  const stored = loadStoredTelemetryPeriod();
  const preset = stored.preset ?? DEFAULT_TELEMETRY_PRESET;
  if (preset === "custom" && stored.from && stored.to) {
    return {
      preset: "custom" as Preset,
      from: dayjs(stored.from),
      to: dayjs(stored.to),
    };
  }
  const range = presetRange(preset);
  return { preset, from: range.from, to: range.to };
}

/** Period state for embedded charts (persisted in localStorage). */
export function useLocalTelemetryPeriod(initialPreset: Preset = DEFAULT_TELEMETRY_PRESET) {
  const [preset, setPresetState] = useState<Preset>(() => {
    const init = initialState();
    return initialPreset !== DEFAULT_TELEMETRY_PRESET ? initialPreset : init.preset;
  });
  const [from, setFromState] = useState(() => {
    const init = initialState();
    return initialPreset !== DEFAULT_TELEMETRY_PRESET
      ? presetRange(initialPreset).from
      : init.from;
  });
  const [to, setToState] = useState(() => {
    const init = initialState();
    return initialPreset !== DEFAULT_TELEMETRY_PRESET ? presetRange(initialPreset).to : init.to;
  });

  const persist = useCallback((p: Preset, fromIso?: string, toIso?: string) => {
    saveStoredTelemetryPeriod({
      preset: p,
      ...(p === "custom" && fromIso && toIso ? { from: fromIso, to: toIso } : {}),
    });
  }, []);

  const setPreset = useCallback(
    (p: Preset) => {
      setPresetState(p);
      if (p !== "custom") {
        const range = presetRange(p);
        setFromState(range.from);
        setToState(range.to);
        persist(p);
      }
    },
    [persist],
  );

  const setFrom = useCallback(
    (v: Dayjs) => {
      setPresetState("custom");
      setFromState(v);
      persist("custom", v.toISOString(), to.toISOString());
    },
    [persist, to],
  );

  const setTo = useCallback(
    (v: Dayjs) => {
      setPresetState("custom");
      setToState(v);
      persist("custom", from.toISOString(), v.toISOString());
    },
    [persist, from],
  );

  const { fromIso, toIso } = useMemo(
    () => ({
      fromIso: from.toISOString(),
      toIso: to.toISOString(),
    }),
    [from, to],
  );

  return { preset, setPreset, from, to, setFrom, setTo, fromIso, toIso };
}
