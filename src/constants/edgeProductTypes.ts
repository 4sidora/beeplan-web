/** Тип конечного устройства в мастере прошивки (расширяется по мере появления прошивок). */
export type EdgeProductTypeId = "multisensor" | "scales";

export type EdgeProductType = {
  id: EdgeProductTypeId;
  label: string;
  /** Есть сборка прошивки на сервере */
  firmwareAvailable: boolean;
  /** Краткое описание возможностей для мастера прошивки */
  capabilities: string;
};

export const EDGE_PRODUCT_TYPES: EdgeProductType[] = [
  {
    id: "multisensor",
    label: "Мультидатчик",
    firmwareAvailable: true,
    capabilities:
      "Автономная коробочка внутри гнезда. Температура, влажность и микрофон встроены. " +
      "Передаёт показания на базовую станцию по ESP-NOW (интервал замера настраивается, дальность Wi-Fi radio). " +
      "Данные отображаются в карточке улья и отчётах по пасеке.",
  },
  {
    id: "scales",
    label: "Пасечные весы",
    firmwareAvailable: true,
    capabilities:
      "Взвешивание ульев на платформе: модуль HX711 (TZT) + тензодатчик, DS18B20 для компенсации " +
      "температурного дрейфа. В мастере можно указать GPIO и режим «полный вес» или «половина» (×2). " +
      "Показания передаются на базовую станцию и отображаются в карточке устройства.",
  },
];

export function edgeProductTypeById(id: EdgeProductTypeId): EdgeProductType | undefined {
  return EDGE_PRODUCT_TYPES.find((t) => t.id === id);
}
