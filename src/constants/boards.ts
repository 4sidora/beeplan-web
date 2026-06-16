export type FirmwareProfile = "gateway" | "edge";

export interface FirmwareBoard {
  id: string;
  label: string;
  /** Краткое описание (1–2 предложения) */
  description: string;
  /** Подробные характеристики и параметры платы */
  features: string[];
  imageUrl: string;
  /** Ссылка на магазин (AliExpress и т.п.) */
  storeUrl?: string;
  profiles: FirmwareProfile[];
  /** Есть сборка прошивки на сервере */
  firmwareAvailable: boolean;
  recommendedForEdge?: boolean;
}

export const FIRMWARE_BOARDS: FirmwareBoard[] = [
  // ——— Gateway ———
  {
    id: "ttgo-t-call-v14",
    label: "LILYGO® TTGO T-Call V1.4",
    description:
      "Базовая станция на ESP32 с модемом SIM800L: Wi-Fi uplink в BeePlan API и приём телеметрии от ульев по ESP-NOW.",
    features: [
      "MCU: ESP32-WROVER-B, 4 MB PSRAM",
      "Сотовый модем: SIMCom SIM800L (2G GSM/GPRS)",
      "Wi-Fi 2.4 GHz — uplink в API (STA)",
      "ESP-NOW Long Range — приём от edge-устройств",
      "USB Type-C, UART-программирование (CP210x)",
      "Слот nano-SIM, антенны Wi-Fi и GSM (U.FL/SMA)",
      "Питание: USB 5 V или Li-ion через JST",
      "Прошивка BeePlan gateway — сборка в мастере",
    ],
    imageUrl: "/boards/ttgo-t-call-v14.png",
    storeUrl: "https://aliexpress.ru/item/33045221960.html",
    profiles: ["gateway"],
    firmwareAvailable: true,
  },
  {
    id: "esp32-custom-wifi",
    label: "ESP32 — кастомная плата (только Wi-Fi)",
    description:
      "Своя плата на ESP32 без сотового модема: Wi-Fi uplink через роутер пасеки и приём ESP-NOW от ульев.",
    features: [
      "MCU: ESP32-WROOM / ESP32-WROVER (classic)",
      "Только Wi-Fi 2.4 GHz — без LTE/GSM",
      "ESP-NOW Long Range — приём от edge-узлов",
      "USB-UART (CP2102 / CH340) или внешний программатор",
      "Питание: USB 5 V или 3.3 V от внешнего БП",
      "Подходит для стационарной пасеки с постоянным Wi-Fi",
      "Прошивка BeePlan gateway — в разработке",
    ],
    imageUrl: "/boards/esp32-custom-wifi.png",
    profiles: ["gateway"],
    firmwareAvailable: false,
  },
  {
    id: "lilygo-t-sim7600",
    label: "LILYGO T-SIM7600 ESP32",
    description:
      "Автономная базовая станция: ESP32 с модемом SIM7600 (4G LTE) и слотом 18650 для пасек без Wi-Fi.",
    features: [
      "MCU: ESP32-WROVER-B",
      "Сотовый модем: SIMCom SIM7600G-H (4G Cat-4, GPS)",
      "Слот 18650 на обратной стороне, зарядка по USB",
      "Два USB Type-C, nano-SIM, антенны LTE и GPS",
      "Вход SOLAR 4.4–6 V — опциональное солнечное питание",
      "microSD, ESP-NOW Long Range",
      "Прошивка BeePlan gateway с LTE uplink — в разработке",
    ],
    imageUrl: "/boards/lilygo-t-sim7600.png",
    storeUrl: "https://aliexpress.ru/item/1005001705250713.html",
    profiles: ["gateway"],
    firmwareAvailable: false,
  },
  // ——— Edge ———
  {
    id: "ttgo-t-energy",
    label: "LILYGO TTGO T-Energy T18 V3.0",
    description:
      "Плата с держателем 18650 и штатным мониторингом напряжения батареи для автономного мультидатчика в улье.",
    features: [
      "MCU: ESP32-WROVER-B, USB-UART (CP2104)",
      "Слот 18650 Li-ion, зарядка и защита на плате",
      "АЦП батареи: GPIO 35, делитель 100k/100k",
      "Deep sleep — длительная автономия от 18650",
      "ESP-NOW Long Range, RSSI по ACK от базовой станции",
      "Размер ~88×23 mm, micro-USB",
      "Прошивка BeePlan edge — сборка в мастере",
    ],
    imageUrl: "/boards/ttgo-t-energy.png",
    profiles: ["edge"],
    firmwareAvailable: true,
    recommendedForEdge: true,
  },
  {
    id: "t-energy-s3",
    label: "LILYGO® T-Energy-S3",
    description:
      "Наследник T-Energy на ESP32-S3: слот 18650, Qwiic и USB-C для компактного edge-узла с датчиками по I2C.",
    features: [
      "MCU: ESP32-S3-WROOM-1, 16 MB flash, 8 MB OPI PSRAM",
      "Слот 18650, зарядка HX6610S, защита IP3005A",
      "АЦП батареи: GPIO 3",
      "Qwiic / STEMMA QT (I2C) — датчики без пайки",
      "USB Type-C, native USB CDC",
      "Deep sleep, ESP-NOW Long Range",
      "Прошивка BeePlan edge — в разработке",
    ],
    imageUrl: "/boards/t-energy-s3.jpg",
    storeUrl: "https://aliexpress.ru/item/1005007242909221.html",
    profiles: ["edge"],
    firmwareAvailable: false,
  },
  {
    id: "t7-s3",
    label: "LILYGO T7 S3 ESP32-S3",
    description:
      "Компактная ESP32-S3 с Qwiic и JST под 1S Li-ion — минимальный edge на батарее для мультидатчика.",
    features: [
      "MCU: ESP32-S3-WROOM-1, 16 MB flash",
      "Размер 39×31 mm — одна из самых компактных S3-плат",
      "Qwiic I2C: GPIO 8 (SDA), GPIO 9 (SCL)",
      "АЦП батареи: GPIO 2, JST 1.25 mm под 1S LiPo/Li-ion",
      "USB Type-C, кнопки RST и BOOT",
      "Deep sleep, ESP-NOW Long Range",
      "Прошивка BeePlan edge — в разработке",
    ],
    imageUrl: "/boards/t7-s3.png",
    storeUrl: "https://aliexpress.ru/item/1005004777561826.html",
    profiles: ["edge"],
    firmwareAvailable: false,
  },
] as const;

export type FirmwareBoardId = (typeof FIRMWARE_BOARDS)[number]["id"];

export function boardsForProfile(profile: FirmwareProfile): FirmwareBoard[] {
  return FIRMWARE_BOARDS.filter((b) => b.profiles.includes(profile));
}

export function boardById(id: string): FirmwareBoard | undefined {
  return FIRMWARE_BOARDS.find((b) => b.id === id);
}

export function defaultBoardForProfile(profile: FirmwareProfile): FirmwareBoardId {
  const available = boardsForProfile(profile).find((b) => b.firmwareAvailable);
  if (!available) {
    throw new Error(`No buildable board for profile: ${profile}`);
  }
  return available.id as FirmwareBoardId;
}

export function isBoardBuildable(id: string): boolean {
  return boardById(id)?.firmwareAvailable === true;
}
