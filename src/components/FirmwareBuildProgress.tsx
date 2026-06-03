import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import type { FirmwareBuild } from "../api";

const PHASE_LABELS: Record<string, string> = {
  preparing: "Подготовка",
  compiling: "Компиляция",
  linking: "Линковка",
  packaging: "Упаковка",
};

const ESTIMATED_SEC: Record<string, number> = {
  gateway: 60,
  edge: 90,
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: string | null | undefined): string {
  if (!phase) return "Подготовка";
  return PHASE_LABELS[phase] ?? phase;
}

type Props = {
  build: FirmwareBuild;
  deviceType: "gateway" | "edge";
};

export function FirmwareBuildProgress({ build, deviceType }: Props) {
  const [showLog, setShowLog] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const inProgress = build.status === "queued" || build.status === "building";

  useEffect(() => {
    if (!inProgress) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [inProgress]);

  const elapsedSec = useMemo(() => {
    const start = new Date(build.created_at).getTime();
    return Math.max(0, Math.floor((now - start) / 1000));
  }, [build.created_at, now]);

  const estimateSec = ESTIMATED_SEC[deviceType] ?? 90;
  const progressValue =
    build.progress_pct != null
      ? build.progress_pct
      : inProgress
        ? Math.min(95, Math.round((elapsedSec / estimateSec) * 100))
        : 0;

  const logLines = build.log_tail ?? [];
  const lastLine = logLines.length > 0 ? logLines[logLines.length - 1] : null;

  if (!inProgress) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <LinearProgress
        variant={build.progress_pct != null ? "determinate" : "indeterminate"}
        value={build.progress_pct != null ? progressValue : undefined}
        sx={{ height: 8, borderRadius: 1 }}
      />
      <Typography color="text.secondary">
        Идёт сборка: <strong>{formatElapsed(elapsedSec)}</strong>
        {" · "}
        {phaseLabel(build.phase)}
        {build.status === "queued" && " (в очереди)"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Обычно {deviceType === "gateway" ? "~1 мин" : "~1.5 мин"} после прогретого toolchain.
      </Typography>
      {lastLine && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            fontSize: 12,
            bgcolor: "action.hover",
            p: 1,
            borderRadius: 1,
            wordBreak: "break-all",
          }}
        >
          {lastLine}
        </Typography>
      )}
      {logLines.length > 1 && (
        <>
          <Typography
            component="button"
            type="button"
            variant="body2"
            onClick={() => setShowLog((v) => !v)}
            sx={{
              alignSelf: "flex-start",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "primary.main",
              p: 0,
              textDecoration: "underline",
            }}
          >
            {showLog ? "Скрыть лог" : "Полный лог"}
          </Typography>
          <Collapse in={showLog}>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.5,
                maxHeight: 240,
                overflow: "auto",
                fontSize: 11,
                bgcolor: "grey.900",
                color: "grey.100",
                borderRadius: 1,
              }}
            >
              {logLines.join("\n")}
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
}
