const ONLINE_THRESHOLD_MS = 300_000;

export function isDeviceOnline(lastSeenAt: string | null | undefined): boolean {
  if (lastSeenAt == null) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}
