export function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return "Никогда";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "только что";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} дн назад`;

  return date.toLocaleString();
}
