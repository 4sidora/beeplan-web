import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import UsbIcon from "@mui/icons-material/Usb";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  detectBeePlanDeviceType,
  formatLogTimestamp,
  formatPortInfo,
  resetEsp32,
} from "../utils/serialMonitor";
import { isWebSerialSupported } from "./EspWebInstallButton";

export type SerialMonitorHandle = {
  getDisplayTitle: () => string;
  getExportBlock: () => string;
  isConnected: () => boolean;
  reboot: () => Promise<void>;
};

type Props = {
  fallbackLabel: string;
  onClose?: () => void;
};

export const SerialMonitorPanel = forwardRef<SerialMonitorHandle, Props>(function SerialMonitorPanel(
  { fallbackLabel, onClose },
  ref,
) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portLabel, setPortLabel] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<"Gateway" | "Edge" | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortRef = useRef(false);
  const lineBufferRef = useRef("");
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const logBoxRef = useRef<HTMLDivElement | null>(null);

  const displayTitle =
    [portLabel ?? fallbackLabel, deviceType].filter(Boolean).join(" · ") || fallbackLabel;

  const rebootDevice = useCallback(async () => {
    const port = portRef.current;
    if (!port) return;
    setError(null);
    lineBufferRef.current = "";
    setLines([]);
    try {
      await resetEsp32(port);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getDisplayTitle: () => displayTitle,
      getExportBlock: () => lines.join("\n"),
      isConnected: () => connected,
      reboot: rebootDevice,
    }),
    [displayTitle, lines, connected, rebootDevice],
  );

  const appendCompleteLines = useCallback((parts: string[]) => {
    if (parts.length === 0) return;
    for (const line of parts) {
      const detected = detectBeePlanDeviceType(line);
      if (detected) {
        setDeviceType(detected);
      }
    }
    const stamped = parts.map((line) => `${formatLogTimestamp()}${line}`);
    setLines((prev) => [...prev, ...stamped].slice(-500));
  }, []);

  const appendChunk = useCallback(
    (text: string) => {
      lineBufferRef.current += text;
      const parts = lineBufferRef.current.split(/\r?\n/);
      lineBufferRef.current = parts.pop() ?? "";
      appendCompleteLines(parts.filter((l) => l.length > 0));
    },
    [appendCompleteLines],
  );

  useEffect(() => {
    const box = logBoxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [lines]);

  const disconnect = useCallback(async () => {
    abortRef.current = true;
    try {
      await readerRef.current?.cancel();
    } catch {
      /* ignore */
    }
    readerRef.current = null;
    try {
      await portRef.current?.close();
    } catch {
      /* ignore */
    }
    portRef.current = null;
    setConnected(false);
  }, []);

  const clearLogs = useCallback(() => {
    lineBufferRef.current = "";
    setLines([]);
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      setError("WebSerial недоступен. Используйте Chrome или Edge на ПК.");
      return;
    }
    setError(null);
    abortRef.current = false;
    lineBufferRef.current = "";
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      const label = formatPortInfo(port);
      setPortLabel(label);
      setConnected(true);
      appendCompleteLines([`--- подключено: ${label} @ 115200 ---`]);

      const reader = port.readable?.getReader();
      if (!reader) throw new Error("Порт не поддерживает чтение");
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (!abortRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) appendChunk(decoder.decode(value));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("cancel")) {
        setError(msg);
      }
      await disconnect();
    }
  }, [appendChunk, appendCompleteLines, disconnect]);

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1, minWidth: 120 }}>
          {displayTitle}
        </Typography>
        {connected ? (
          <>
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={() => void rebootDevice()}
            >
              Перезагрузить
            </Button>
            <Button size="small" onClick={clearLogs}>
              Очистить
            </Button>
            <Button size="small" color="warning" onClick={() => void disconnect()}>
              Отключить
            </Button>
          </>
        ) : (
          <Button size="small" variant="contained" startIcon={<UsbIcon />} onClick={() => void connect()}>
            Подключить
          </Button>
        )}
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label="Закрыть монитор">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 1, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      <Box
        ref={logBoxRef}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "auto",
          fontFamily: "monospace",
          fontSize: 13,
          bgcolor: "grey.900",
          color: "grey.100",
          p: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {lines.length === 0 ? (
          <Typography variant="body2" color="grey.500">
            Ожидание данных…
          </Typography>
        ) : (
          lines.map((line, i) => <div key={i}>{line}</div>)
        )}
        <div ref={logEndRef} />
      </Box>
    </Paper>
  );
});
