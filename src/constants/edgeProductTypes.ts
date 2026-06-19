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
    firmwareAvailable: false,
    capabilities:
      "Платформа для взвешивания ульев или групп ульев на пасеке: фиксирует массу, помогает " +
      "отслеживать запасы, рост и возможную голодную зимовку. Планируется передача показаний " +
      "на базовую станцию и отображение динамики веса в BeePlan вместе с остальной телеметрией пасеки.",
  },
];

export function edgeProductTypeById(id: EdgeProductTypeId): EdgeProductType | undefined {
  return EDGE_PRODUCT_TYPES.find((t) => t.id === id);
}
