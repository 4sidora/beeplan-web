export type ColonyTypeCode = "split" | "nucleus" | "colony" | "swarm";

export const COLONY_TYPES: { code: ColonyTypeCode; label: string }[] = [
  { code: "split", label: "Отводок" },
  { code: "nucleus", label: "Нуклеус" },
  { code: "colony", label: "Семья" },
  { code: "swarm", label: "Рой" },
];

export type HiveTypeCode =
  | "dadant_laying"
  | "dadant"
  | "ruta"
  | "magazin"
  | "udav"
  | "mfu"
  | "koloda";

export type HiveTypeSpec = {
  code: HiveTypeCode;
  label: string;
  frameOptions: number[];
  fixedFrames: number | null;
  allowsBodyCount: boolean;
  usesVolume: boolean;
};

export const HIVE_TYPES: HiveTypeSpec[] = [
  {
    code: "dadant_laying",
    label: "Лежак Дадан",
    frameOptions: [16, 20, 24],
    fixedFrames: null,
    allowsBodyCount: true,
    usesVolume: false,
  },
  {
    code: "dadant",
    label: "Дадан",
    frameOptions: [6, 8, 10, 12],
    fixedFrames: null,
    allowsBodyCount: true,
    usesVolume: false,
  },
  {
    code: "ruta",
    label: "Рута",
    frameOptions: [],
    fixedFrames: 10,
    allowsBodyCount: false,
    usesVolume: false,
  },
  {
    code: "magazin",
    label: "Магазинка",
    frameOptions: [6, 8, 10, 12],
    fixedFrames: null,
    allowsBodyCount: true,
    usesVolume: false,
  },
  {
    code: "udav",
    label: "Удав",
    frameOptions: [],
    fixedFrames: 9,
    allowsBodyCount: false,
    usesVolume: false,
  },
  {
    code: "mfu",
    label: "МФУ",
    frameOptions: [],
    fixedFrames: 8,
    allowsBodyCount: false,
    usesVolume: false,
  },
  {
    code: "koloda",
    label: "Колода",
    frameOptions: [],
    fixedFrames: null,
    allowsBodyCount: false,
    usesVolume: true,
  },
];

export const HIVE_TYPE_BY_CODE = Object.fromEntries(
  HIVE_TYPES.map((h) => [h.code, h]),
) as Record<HiveTypeCode, HiveTypeSpec>;

export const EDGE_DEVICE_METRICS_LABEL =
  "Температура, влажность, акустика";

export function colonyTypeLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return COLONY_TYPES.find((t) => t.code === code)?.label ?? code;
}

export function hiveTypeLabel(code: string | null | undefined): string {
  if (!code) return "—";
  const spec = HIVE_TYPES.find((h) => h.code === code);
  return spec?.label ?? code;
}

export function formatHiveDetails(
  hiveType: string | null | undefined,
  bodyCount: number | null | undefined,
  framesPerBody: number | null | undefined,
  hiveVolumeM3: number | null | undefined,
): string {
  if (!hiveType) return "—";
  const spec = HIVE_TYPE_BY_CODE[hiveType as HiveTypeCode];
  if (!spec) return "—";
  if (spec.usesVolume) {
    return hiveVolumeM3 != null ? `${hiveVolumeM3} м³` : "—";
  }
  const parts: string[] = [];
  if (spec.allowsBodyCount && bodyCount != null) {
    parts.push(`${bodyCount} корп.`);
  }
  const frames = spec.fixedFrames ?? framesPerBody;
  if (frames != null) {
    parts.push(`${frames} рам.`);
  }
  return parts.length ? parts.join(", ") : spec.label;
}

export type HiveFieldState = {
  hiveType: HiveTypeCode | "";
  bodyCount: number | "";
  framesPerBody: number | "";
  hiveVolumeM3: number | "";
};

export function defaultHiveFieldsForType(code: HiveTypeCode | ""): Partial<HiveFieldState> {
  if (!code) {
    return { bodyCount: "", framesPerBody: "", hiveVolumeM3: "" };
  }
  const spec = HIVE_TYPE_BY_CODE[code];
  if (spec.usesVolume) {
    return { bodyCount: "", framesPerBody: "", hiveVolumeM3: "" };
  }
  if (spec.fixedFrames != null) {
    return { bodyCount: 1, framesPerBody: spec.fixedFrames, hiveVolumeM3: "" };
  }
  return {
    bodyCount: spec.allowsBodyCount ? 1 : "",
    framesPerBody: spec.frameOptions[0] ?? "",
    hiveVolumeM3: "",
  };
}

export function hiveFieldsToPayload(state: HiveFieldState): {
  hive_type: string | null;
  body_count: number | null;
  frames_per_body: number | null;
  hive_volume_m3: number | null;
} {
  if (!state.hiveType) {
    return {
      hive_type: null,
      body_count: null,
      frames_per_body: null,
      hive_volume_m3: null,
    };
  }
  const spec = HIVE_TYPE_BY_CODE[state.hiveType];
  if (spec.usesVolume) {
    return {
      hive_type: state.hiveType,
      body_count: null,
      frames_per_body: null,
      hive_volume_m3: state.hiveVolumeM3 === "" ? null : Number(state.hiveVolumeM3),
    };
  }
  if (spec.fixedFrames != null) {
    return {
      hive_type: state.hiveType,
      body_count: 1,
      frames_per_body: spec.fixedFrames,
      hive_volume_m3: null,
    };
  }
  return {
    hive_type: state.hiveType,
    body_count: state.bodyCount === "" ? null : Number(state.bodyCount),
    frames_per_body: state.framesPerBody === "" ? null : Number(state.framesPerBody),
    hive_volume_m3: null,
  };
}

export function hiveFieldsFromColony(c: {
  hive_type?: string | null;
  body_count?: number | null;
  frames_per_body?: number | null;
  hive_volume_m3?: number | null;
}): HiveFieldState {
  const code = (c.hive_type ?? "") as HiveTypeCode | "";
  return {
    hiveType: code,
    bodyCount: c.body_count ?? "",
    framesPerBody: c.frames_per_body ?? "",
    hiveVolumeM3: c.hive_volume_m3 ?? "",
  };
}
