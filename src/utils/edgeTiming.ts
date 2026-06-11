/** Человекочитаемый интервал пробуждения edge (WAKE_INTERVAL_SEC). */
export function formatWakeInterval(sec: number | null | undefined): string {
  if (sec == null) return "—";
  if (sec % 3600 === 0 && sec >= 3600) {
    const hours = sec / 3600;
    return `${sec} с (раз в ${hours} ч)`;
  }
  if (sec % 60 === 0 && sec >= 60) {
    return `${sec} с (раз в ${sec / 60} мин)`;
  }
  return `${sec} с`;
}

/** TDMA-слот внутри цикла замера. */
export function formatTelemetrySlot(
  slotSec: number | null | undefined,
  wakeSec: number | null | undefined,
): string {
  if (slotSec == null) return "—";
  const cycle = wakeSec ?? 3600;
  if (cycle >= 3600 && cycle % 3600 === 0) {
    const mm = Math.floor(slotSec / 60);
    const ss = slotSec % 60;
    const clock = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    return `${slotSec} с (в :${clock} каждого часа)`;
  }
  return `${slotSec} с (смещение внутри цикла ${cycle} с)`;
}
