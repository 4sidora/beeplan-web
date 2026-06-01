import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useCallback, useState } from "react";
import { SerialMonitorPanel } from "../components/SerialMonitorPanel";
import { PageHeader } from "../components/PageHeader";

type MonitorTab = { id: string; label: string };

let nextTabId = 1;

function newTab(index: number): MonitorTab {
  return { id: `tab-${nextTabId++}`, label: `Монитор ${index}` };
}

const INITIAL_MONITOR = (() => {
  const first = newTab(1);
  return { tabs: [first] as MonitorTab[], activeId: first.id };
})();

export function SerialMonitorPage() {
  const [tabs, setTabs] = useState<MonitorTab[]>(INITIAL_MONITOR.tabs);
  const [activeId, setActiveId] = useState(INITIAL_MONITOR.activeId);

  const addTab = useCallback(() => {
    const tab = newTab(tabs.length + 1);
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }, [tabs.length]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((t) => t.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id ?? "");
        }
        return next;
      });
    },
    [activeId],
  );

  const activeIndex = tabs.findIndex((t) => t.id === activeId);

  return (
    <>
      <PageHeader title="Монитор порта" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Откройте несколько вкладок для одновременного просмотра разных COM-портов. Переключение
        вкладок не отключает порт.
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeIndex >= 0 ? activeIndex : 0}
          onChange={(_, idx) => setActiveId(tabs[idx]?.id ?? "")}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flexGrow: 1 }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {tab.label}
                  {tabs.length > 1 && (
                    <IconButton
                      component="span"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      aria-label="Закрыть вкладку"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
        <Button size="small" startIcon={<AddIcon />} onClick={addTab} sx={{ ml: 1, flexShrink: 0 }}>
          Новая вкладка
        </Button>
      </Box>

      <Box sx={{ position: "relative", minHeight: 420 }}>
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            hidden={tab.id !== activeId}
            sx={{ display: tab.id === activeId ? "block" : "none" }}
          >
            <SerialMonitorPanel label={tab.label} />
          </Box>
        ))}
      </Box>
    </>
  );
}
