/** Heartbeat gateway, с — см. kHeartbeatIntervalMs в прошивке. */
const GATEWAY_HEARTBEAT_SEC = 15 * 60;

const WAKE_ONLINE_FACTOR = 1.1;

/** Порог для gateway / concentrator: heartbeat × 1.1. */
const GATEWAY_ONLINE_THRESHOLD_MS = GATEWAY_HEARTBEAT_SEC * WAKE_ONLINE_FACTOR * 1000;

export function onlineThresholdMs(wakeIntervalSec?: number | null): number {
  if (wakeIntervalSec != null && wakeIntervalSec >= 10) {
    return wakeIntervalSec * WAKE_ONLINE_FACTOR * 1000;
  }
  return GATEWAY_ONLINE_THRESHOLD_MS;
}

export function isDeviceOnline(
  lastSeenAt: string | null | undefined,
  wakeIntervalSec?: number | null,
): boolean {
  if (lastSeenAt == null) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < onlineThresholdMs(wakeIntervalSec);
}
