export type FirmwareProfile = "gateway" | "edge";

export interface FirmwareBoard {
  id: string;
  label: string;
  description: string;
  features: string[];
  imageUrl?: string;
  profiles: FirmwareProfile[];
  recommendedForEdge?: boolean;
}

export const FIRMWARE_BOARDS: FirmwareBoard[] = [
  {
    id: "ttgo-t-energy",
    label: "LILYGO TTGO T-Energy T18 V3.0",
    description:
      "Плата с держателем 18650 и штатным мониторингом напряжения батареи. Рекомендуется для полевых мультидатчиков BeePlan.",
    features: [
      "ESP32-WROVER-B, USB-UART (CP2104)",
      "Слот 18650 Li-ion, зарядка по USB",
      "АЦП батареи на GPIO 35 (делитель на плате)",
      "RSSI ESP-NOW по ACK от базовой станции",
      "Deep sleep для длительной автономии",
    ],
    imageUrl: "/boards/ttgo-t-energy.jpg",
    profiles: ["edge"],
    recommendedForEdge: true,
  },
  {
    id: "esp32dev",
    label: "ESP32 DevKit (универсальная)",
    description:
      "Любая плата на ESP32 (WROOM/WROVER) без встроенного мониторинга батареи — для отладки и кастомной обвязки.",
    features: [
      "ESP32 classic",
      "Тестовые значения батареи и сигнала в прошивке",
      "Подходит для проверки радиоканала и API",
    ],
    profiles: ["gateway", "edge"],
  },
  {
    id: "esp32c3",
    label: "ESP32-C3 (CH343 / CH340)",
    description: "Модули на ESP32-C3 с USB-UART (например CORE-ESP32-C3).",
    features: ["ESP32-C3", "UART0 на GPIO20/21"],
    profiles: ["gateway", "edge"],
  },
  {
    id: "esp32c3-usb",
    label: "ESP32-C3 (нативный USB)",
    description: "ESP32-C3 с USB CDC без внешнего UART-чипа.",
    features: ["ESP32-C3", "USB CDC console"],
    profiles: ["gateway", "edge"],
  },
] as const;

export type FirmwareBoardId = (typeof FIRMWARE_BOARDS)[number]["id"];

export function boardsForProfile(profile: FirmwareProfile): FirmwareBoard[] {
  return FIRMWARE_BOARDS.filter((b) => b.profiles.includes(profile));
}

export function boardById(id: FirmwareBoardId): FirmwareBoard | undefined {
  return FIRMWARE_BOARDS.find((b) => b.id === id);
}
