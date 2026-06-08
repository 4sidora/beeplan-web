import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import type { TelemetryPoint } from "../api";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";

type Props = {
  recentTelemetry?: TelemetryPoint[];
  expanded: boolean;
  onToggle: () => void;
};

export function DeviceStatusToggle({ recentTelemetry, expanded, onToggle }: Props) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
      <DeviceStatusIndicators recentTelemetry={recentTelemetry} />
      <Link
        component="button"
        type="button"
        variant="body2"
        underline="hover"
        onClick={onToggle}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {expanded ? "Скрыть" : "Подробнее"}
        {expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
      </Link>
    </Box>
  );
}
