export function formatPortInfo(port: SerialPort): string {
  if ("getInfo" in port && typeof port.getInfo === "function") {
    const info = port.getInfo();
    if (info.usbVendorId != null && info.usbProductId != null) {
      const vid = info.usbVendorId.toString(16).padStart(4, "0");
      const pid = info.usbProductId.toString(16).padStart(4, "0");
      return `USB ${vid}:${pid}`;
    }
  }
  return "Serial";
}

/** Определение типа устройства по строке boot-лога BeePlan. */
export function detectBeePlanDeviceType(line: string): "Gateway" | "Edge" | null {
  const lower = line.toLowerCase();
  if (lower.includes("beeplan gateway") || lower.includes("beeplan-gateway")) {
    return "Gateway";
  }
  if (lower.includes("beeplan edge") || lower.includes("beeplan-edge")) {
    return "Edge";
  }
  return null;
}

export function formatLogTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
}

/**
 * Обычный сброс ESP32 (run mode), как esptool hard_reset.
 * DTR → GPIO0: держим high (не bootloader). Импульс RTS → EN.
 */
export async function resetEsp32(port: SerialPort): Promise<void> {
  if (!("setSignals" in port) || typeof port.setSignals !== "function") {
    throw new Error("Порт не поддерживает сброс (setSignals)");
  }
  await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  await sleep(50);
  await port.setSignals({ dataTerminalReady: false, requestToSend: true });
  await sleep(100);
  await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  await sleep(50);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
