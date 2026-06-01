import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { api, type FirmwareBuild } from "../api";

type Props = {
  deviceType: "gateway" | "edge";
  /** Версия с концентратора (heartbeat), только для gateway */
  installedVersion?: string | null;
  /** Текущая или завершённая сборка */
  build?: FirmwareBuild | null;
  compact?: boolean;
};

export function FirmwareVersionInfo({
  deviceType,
  installedVersion,
  build,
  compact = false,
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

  const lines: string[] = [];
  if (available) {
    const serverVersion =
      deviceType === "gateway" ? available.gateway_version : available.edge_version;
    lines.push(
      `Доступная на сервере: ${serverVersion} · ${serialTag ?? "—"}`,
    );
  }

  if (deviceType === "gateway") {
    if (installedVersion) {
      lines.push(`На концентраторе (API): ${installedVersion}`);
    } else {
      lines.push("На концентраторе: ещё не зарегистрирована или старая прошивка");
    }
  }

  if (build?.firmware_version) {
    const built =
      build.status === "ready"
        ? `Собрана для прошивки: ${build.firmware_version}`
        : `Сборка (${build.status}): ${build.firmware_version}`;
    const tag = build.serial_tag ? ` · ${build.serial_tag}` : "";
    lines.push(built + tag);
  }

  const mismatch =
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
          После прошивки в Serial должно появиться «{serialTag}». Сейчас на устройстве другая
          версия — прошейте заново из этой сборки.
        </Typography>
      )}
      {!compact && available && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Если в мониторе порта нет метки {serialTag}, используйте новую сборку, а не старый файл
          прошивки.
        </Typography>
      )}
    </>
  );

  if (compact) {
    return <Alert severity="info" sx={{ mb: 2 }}>{content}</Alert>;
  }

  return (
    <Alert severity="info" sx={{ mb: 2, "& .MuiAlert-message": { width: "100%" } }}>
      <Typography variant="subtitle2" gutterBottom>
        Версия прошивки
      </Typography>
      {content}
    </Alert>
  );
}
