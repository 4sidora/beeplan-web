import UsbIcon from "@mui/icons-material/Usb";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCallback, useRef, useState } from "react";
import { isWebSerialSupported } from "./EspWebInstallButton";

type Props = {
  label: string;
};

export function SerialMonitorPanel({ label }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const abortRef = useRef(false);

  const appendLine = useCallback((text: string) => {
    const parts = text.split(/\r?\n/).filter((l) => l.length > 0);
    if (parts.length === 0) return;
    setLines((prev) => {
      const next = [...prev, ...parts];
      return next.slice(-500);
    });
  }, []);

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

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      setError("WebSerial недоступен. Используйте Chrome или Edge на ПК.");
      return;
    }
    setError(null);
    abortRef.current = false;
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setConnected(true);
      appendLine(`--- подключено: ${label} @ 115200 ---`);

      const reader = port.readable?.getReader();
      if (!reader) throw new Error("Порт не поддерживает чтение");
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (!abortRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) appendLine(decoder.decode(value));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("cancel")) {
        setError(msg);
      }
      await disconnect();
    }
  }, [appendLine, label, disconnect]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
      {!isWebSerialSupported() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          WebSerial недоступен. Откройте приложение в Chrome или Edge на компьютере.
        </Alert>
      )}
      <Alert severity="info" sx={{ mb: 2 }}>
        Подключите устройство по USB, закройте Arduino IDE и вкладку прошивки (COM-порт должен быть
        свободен), затем нажмите «Подключить порт».
      </Alert>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {connected ? (
          <Button color="warning" onClick={() => void disconnect()}>
            Отключить
          </Button>
        ) : (
          <Button variant="contained" startIcon={<UsbIcon />} onClick={() => void connect()}>
            Подключить порт
          </Button>
        )}
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          fontFamily: "monospace",
          fontSize: 13,
          bgcolor: "grey.900",
          color: "grey.100",
          p: 1.5,
          borderRadius: 1,
          minHeight: 320,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {lines.length === 0 ? (
          <Typography variant="body2" color="grey.500">
            Ожидание данных…
          </Typography>
        ) : (
          lines.join("\n")
        )}
      </Box>
    </Box>
  );
}
