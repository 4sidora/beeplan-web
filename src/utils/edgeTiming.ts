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
