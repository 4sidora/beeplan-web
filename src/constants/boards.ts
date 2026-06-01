export const FIRMWARE_BOARDS = [
  { id: "esp32dev", label: "ESP32 (classic, DevKit)" },
  {
    id: "esp32c3",
    label: "ESP32-C3 (CH343 / CH340, CORE-ESP32-C3 и аналоги)",
  },
  {
    id: "esp32c3-usb",
    label: "ESP32-C3 (нативный USB, без CH343)",
  },
] as const;

export type FirmwareBoardId = (typeof FIRMWARE_BOARDS)[number]["id"];
