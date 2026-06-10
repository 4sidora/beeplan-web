import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useCallback, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { SerialMonitorPanel, type SerialMonitorHandle } from "../components/SerialMonitorPanel";
import { useSnackbar } from "../components/SnackbarProvider";

type MonitorPane = { id: string; label: string };

const MAX_PANES = 3;

let nextPaneId = 1;

function newPane(index: number): MonitorPane {
  return { id: `pane-${nextPaneId++}`, label: `Монитор ${index}` };
}

const INITIAL_PANE = (() => {
  const first = newPane(1);
  return [first] as MonitorPane[];
})();

export function SerialMonitorPage() {
  const { showSuccess, showError } = useSnackbar();
  const [panes, setPanes] = useState<MonitorPane[]>(INITIAL_PANE);
  const panelRefs = useRef<Map<string, SerialMonitorHandle>>(new Map());

  const setPanelRef = useCallback((id: string, handle: SerialMonitorHandle | null) => {
    if (handle) {
      panelRefs.current.set(id, handle);
    } else {
      panelRefs.current.delete(id);
    }
  }, []);

  const addPane = useCallback(() => {
    setPanes((prev) => {
      if (prev.length >= MAX_PANES) return prev;
      return [...prev, newPane(prev.length + 1)];
    });
  }, []);

  const closePane = useCallback((id: string) => {
    setPanes((prev) => {
      if (prev.length <= 1) return prev;
      panelRefs.current.delete(id);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const rebootAll = useCallback(async () => {
    const targets = panes
      .map((pane) => panelRefs.current.get(pane.id))
      .filter((handle): handle is SerialMonitorHandle => handle != null && handle.isConnected());

    if (targets.length === 0) {
      showError("Нет подключённых портов");
      return;
    }

    await Promise.all(targets.map((handle) => handle.reboot()));
    showSuccess(
      targets.length === 1
        ? "Устройство перезагружено"
        : `Перезагружено устройств: ${targets.length}`,
    );
  }, [panes, showError, showSuccess]);

  const copyAllLogs = useCallback(async () => {
    const blocks = panes
      .map((pane) => {
        const handle = panelRefs.current.get(pane.id);
        const title = handle?.getDisplayTitle() ?? pane.label;
        const body = handle?.getExportBlock() ?? "";
        if (!body.trim()) {
          return `=== ${title} ===\n(пусто)`;
        }
        return `=== ${title} ===\n${body}`;
      })
      .join("\n\n");

    if (!blocks.trim()) {
      showError("Нет данных для копирования");
      return;
    }

    try {
      await navigator.clipboard.writeText(blocks);
      showSuccess("Все логи скопированы в буфер обмена");
    } catch {
      showError("Не удалось скопировать в буфер обмена");
    }
  }, [panes, showError, showSuccess]);

  const gridColumns = panes.length === 1 ? "1fr" : panes.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 112px)",
        overflow: "hidden",
      }}
    >
      <PageHeader title="Монитор порта" />

      <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
        Подключите устройство по USB, закройте Arduino IDE и вкладку прошивки (COM-порт должен быть
        свободен), затем нажмите «Подключить» в нужном окне.
      </Alert>

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexShrink: 0, flexWrap: "wrap" }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addPane}
          disabled={panes.length >= MAX_PANES}
        >
          Добавить монитор
        </Button>
        <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => void copyAllLogs()}>
          Скопировать все логи
        </Button>
        <Button size="small" startIcon={<RestartAltIcon />} onClick={() => void rebootAll()}>
          Перезагрузить всё
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: gridColumns },
          gap: 2,
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {panes.map((pane) => (
          <SerialMonitorPanel
            key={pane.id}
            ref={(handle) => setPanelRef(pane.id, handle)}
            fallbackLabel={pane.label}
            onClose={panes.length > 1 ? () => closePane(pane.id) : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}
