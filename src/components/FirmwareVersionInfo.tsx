import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type FirmwareBuild } from "../api";

type Props = {
  deviceType: "gateway" | "edge";
  /** Версия с базовой станции (heartbeat), только для gateway */
  installedVersion?: string | null;
  /** Текущая или завершённая сборка */
  build?: FirmwareBuild | null;
  compact?: boolean;
  /** Только заголовок и две строки (мастер прошивки, шаг «Устройство») */
  installOverview?: boolean;
  /** Текст под версиями в том же синем блоке */
  description?: string;
};

function firmwareSerialTag(
  version: string | null | undefined,
  deviceType: "gateway" | "edge",
): string | null {
  if (!version) return null;
  if (version.includes("beeplan-")) return version;
  return deviceType === "gateway" ? `beeplan-Gateway-${version}` : `beeplan-Edge-${version}`;
}

export function FirmwareVersionInfo({
  deviceType,
  installedVersion,
  build,
  compact = false,
  installOverview = false,
  description,
}: Props) {
  const releases = useQuery({
    queryKey: ["firmware-releases"],
    queryFn: () => api.firmwareReleases(),
    staleTime: 60_000,
  });

  const available = releases.data;
  const serialTag =
    deviceType === "gateway" ? available?.gateway_serial_tag : available?.edge_serial_tag;

  if (releases.isLoading) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Загрузка информации о версии прошивки…
      </Typography>
    );
  }

  if (releases.isError) {
    return (
      <Alert severity="warning" sx={{ mb: 2, py: compact ? 0.5 : 1 }}>
        Не удалось получить версию прошивки с сервера сборки.
      </Alert>
    );
  }

  const overviewRows: { label: string; value: string }[] = [];
  if (installOverview && available) {
    overviewRows.push({
      label: "Доступная на сервере:",
      value: serialTag ?? "—",
    });
    if (deviceType === "gateway") {
      overviewRows.push({
        label: "На базовой станции (API):",
        value: firmwareSerialTag(installedVersion, "gateway") ?? "—",
      });
    } else {
      overviewRows.push({
        label: "На устройстве (API):",
        value: firmwareSerialTag(installedVersion, "edge") ?? "—",
      });
    }
  }

  const lines: string[] = [];
  if (available && !installOverview) {
    const serverVersion =
      deviceType === "gateway" ? available.gateway_version : available.edge_version;
    lines.push(`Доступная на сервере: ${serverVersion} · ${serialTag ?? "—"}`);
  }

  if (deviceType === "gateway" && !installOverview) {
    const installedTag = firmwareSerialTag(installedVersion, "gateway");
    if (installedVersion) {
      lines.push(`На базовой станции (API): ${installedTag ?? installedVersion}`);
    } else {
      lines.push("На базовой станции: ещё не зарегистрирована или старая прошивка");
    }
  }

  if (!installOverview && build?.firmware_version) {
    const built =
      build.status === "ready"
        ? `Собрана для прошивки: ${build.firmware_version}`
        : `Сборка (${build.status}): ${build.firmware_version}`;
    const tag = build.serial_tag ? ` · ${build.serial_tag}` : "";
    lines.push(built + tag);
  }

  const mismatch =
    !installOverview &&
    build?.status === "ready" &&
    build.firmware_version &&
    available &&
    build.firmware_version === available.firmware_version &&
    deviceType === "gateway" &&
    installedVersion &&
    installedVersion !== build.firmware_version;

  const content = (
    <>
      {lines.map((line) => (
        <Typography key={line} variant="body2" component="div">
          {line}
        </Typography>
      ))}
      {mismatch && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
          На устройстве другая версия — прошейте заново из новой сборки.
        </Typography>
      )}
    </>
  );

  if (installOverview) {
    return (
      <Alert severity="info" sx={{ mb: 2, "& .MuiAlert-message": { width: "100%" } }}>
        <Typography
          component="div"
          variant="subtitle1"
          sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1 }}
        >
          Версия прошивки
        </Typography>
        <Box
          component="dl"
          sx={{
            m: 0,
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            columnGap: 2,
            rowGap: 0.5,
            alignItems: "baseline",
          }}
        >
          {overviewRows.map((row) => (
            <Fragment key={row.label}>
              <Typography component="dt" variant="body2" sx={{ m: 0, whiteSpace: "nowrap" }}>
                {row.label}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                {row.value}
              </Typography>
            </Fragment>
          ))}
        </Box>
        {description ? (
          <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.65 }}>
            {description}
          </Typography>
        ) : null}
      </Alert>
    );
  }

  if (compact) {
    return <Alert severity="info" sx={{ mb: 2 }}>{content}</Alert>;
  }

  return (
    <Alert severity="info" sx={{ mb: 2, "& .MuiAlert-message": { width: "100%" } }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Версия прошивки
      </Typography>
      {content}
    </Alert>
  );
}
