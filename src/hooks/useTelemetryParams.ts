import { useCallback, useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
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

export function useTelemetryPeriod(): {
  preset: Preset;
  setPreset: (p: Preset) => void;
  from: Dayjs;
  to: Dayjs;
  setFrom: (v: Dayjs) => void;
  setTo: (v: Dayjs) => void;
  fromIso: string;
  toIso: string;
} {
  const [params, setParams] = useSearchParams();
  const rawPreset = params.get("preset") as Preset | null;
  const urlPreset =
    rawPreset && ["1h", "24h", "7d", "14d", "30d", "custom"].includes(rawPreset)
      ? rawPreset
      : null;
  const stored = useMemo(() => loadStoredTelemetryPeriod(), []);
  const preset: Preset = urlPreset ?? stored.preset ?? DEFAULT_TELEMETRY_PRESET;

  const rawFrom = params.get("from");
  const rawTo = params.get("to");

  const { from, to, fromIso, toIso } = useMemo(() => {
    const range =
      preset === "custom"
        ? {
            from: rawFrom
              ? dayjs(rawFrom)
              : stored.from
                ? dayjs(stored.from)
                : presetRange(DEFAULT_TELEMETRY_PRESET).from,
            to: rawTo ? dayjs(rawTo) : stored.to ? dayjs(stored.to) : dayjs(),
          }
        : presetRange(preset);
    return {
      from: range.from,
      to: range.to,
      fromIso: range.from.toISOString(),
      toIso: range.to.toISOString(),
    };
  }, [preset, rawFrom, rawTo, stored.from, stored.to]);

  const persist = useCallback((p: Preset, fromIso?: string, toIso?: string) => {
    saveStoredTelemetryPeriod({
      preset: p,
      ...(p === "custom" && fromIso && toIso ? { from: fromIso, to: toIso } : {}),
    });
  }, []);

  const setPreset = useCallback(
    (p: Preset) => {
      persist(p);
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("preset", p);
        if (p !== "custom") {
          next.delete("from");
          next.delete("to");
        }
        return next;
      });
    },
    [setParams, persist],
  );

  const setFrom = useCallback(
    (v: Dayjs) => {
      const fromIsoVal = v.toISOString();
      persist("custom", fromIsoVal, to.toISOString());
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("preset", "custom");
        next.set("from", fromIsoVal);
        return next;
      });
    },
    [setParams, persist, to],
  );

  const setTo = useCallback(
    (v: Dayjs) => {
      const toIsoVal = v.toISOString();
      persist("custom", from.toISOString(), toIsoVal);
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("preset", "custom");
        next.set("to", toIsoVal);
        return next;
      });
    },
    [setParams, persist, from],
  );

  return {
    preset,
    setPreset,
    from,
    to,
    setFrom,
    setTo,
    fromIso,
    toIso,
  };
}

export type TelemetryViewMode = "single" | "all" | "selected";

export function useTelemetryViewParams(colonyIds: number[] = []): {
  mode: TelemetryViewMode;
  setMode: (m: TelemetryViewMode) => void;
  colonyId: number | null;
  setColonyId: (id: number | null) => void;
  selectedColonyIds: number[];
  setSelectedColonyIds: (ids: number[]) => void;
  toggleColonyId: (id: number) => void;
} {
  const [params, setParams] = useSearchParams();
  const rawMode = params.get("mode") as TelemetryViewMode | null;
  const mode: TelemetryViewMode =
    rawMode && ["single", "all", "selected"].includes(rawMode) ? rawMode : "single";

  const rawColonyId = params.get("colony_id");
  const parsedColonyId =
    rawColonyId && Number.isFinite(Number(rawColonyId)) ? Number(rawColonyId) : null;
  const colonyId =
    parsedColonyId != null && colonyIds.includes(parsedColonyId)
      ? parsedColonyId
      : colonyIds[0] ?? null;

  const rawIds = params.get("colony_ids");
  const parsedSelected = rawIds
    ? rawIds
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => colonyIds.includes(n))
    : [];
  const selectedColonyIds =
    parsedSelected.length > 0 ? parsedSelected : colonyIds.slice(0, Math.min(2, colonyIds.length));

  const setMode = useCallback(
    (m: TelemetryViewMode) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("mode", m);
        return next;
      });
    },
    [setParams],
  );

  const setColonyId = useCallback(
    (id: number | null) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id == null) next.delete("colony_id");
        else next.set("colony_id", String(id));
        return next;
      });
    },
    [setParams],
  );

  const setSelectedColonyIds = useCallback(
    (ids: number[]) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (ids.length === 0) next.delete("colony_ids");
        else next.set("colony_ids", ids.join(","));
        return next;
      });
    },
    [setParams],
  );

  const toggleColonyId = useCallback(
    (id: number) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = (next.get("colony_ids") ?? "")
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n));
        const set = new Set(current);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        const arr = [...set];
        if (arr.length === 0) next.delete("colony_ids");
        else next.set("colony_ids", arr.join(","));
        return next;
      });
    },
    [setParams],
  );

  return { mode, setMode, colonyId, setColonyId, selectedColonyIds, setSelectedColonyIds, toggleColonyId };
}
