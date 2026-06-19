import type { Preset } from "../utils/telemetry";

export const TELEMETRY_PERIOD_STORAGE_KEY = "beeplan_telemetry_period";
export const DEFAULT_TELEMETRY_PRESET: Preset = "24h";

export type StoredTelemetryPeriod = {
  preset: Preset;
  from?: string;
  to?: string;
};

const VALID_PRESETS: Preset[] = ["1h", "24h", "7d", "14d", "30d", "custom"];

export function loadStoredTelemetryPeriod(): StoredTelemetryPeriod {
  try {
    const raw = localStorage.getItem(TELEMETRY_PERIOD_STORAGE_KEY);
    if (!raw) {
      return { preset: DEFAULT_TELEMETRY_PRESET };
    }
    const parsed = JSON.parse(raw) as StoredTelemetryPeriod;
    if (!parsed?.preset || !VALID_PRESETS.includes(parsed.preset)) {
      return { preset: DEFAULT_TELEMETRY_PRESET };
    }
    return parsed;
  } catch {
    return { preset: DEFAULT_TELEMETRY_PRESET };
  }
}

export function saveStoredTelemetryPeriod(period: StoredTelemetryPeriod): void {
  try {
    localStorage.setItem(TELEMETRY_PERIOD_STORAGE_KEY, JSON.stringify(period));
  } catch {
    // ignore quota / private mode
  }
}
