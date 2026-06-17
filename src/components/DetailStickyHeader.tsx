import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { TelemetryPoint } from "../api";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";
import type { HeaderAction } from "./ObjectCardHeader";

function HeaderButton({ action }: { action: HeaderAction }) {
  if (action.to) {
    return (
      <Button
        size="small"
        variant={action.variant}
        component={RouterLink}
        to={action.to}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    );
  }
  return (
    <Button size="small" variant={action.variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

type Props = {
  backTo: string;
  backLabel: string;
  title: string;
  lastSeenAt?: string | null;
  /** Интервал замера edge, с; для gateway не передавать. */
  wakeIntervalSec?: number | null;
  titleVariant?: "h5" | "h6";
  recentTelemetry?: TelemetryPoint[];
  secondaryActions?: HeaderAction[];
  primaryAction: HeaderAction;
  /** Доп. элементы между статусом и кнопками (редко). */
  trailing?: ReactNode;
};

/** Липкая шапка детальной страницы: назад, заголовок, сигнал/батарея и действия в одной строке. */
export function DetailStickyHeader({
  backTo,
  backLabel,
  title,
  lastSeenAt,
  wakeIntervalSec,
  titleVariant = "h5",
  recentTelemetry,
  secondaryActions = [],
  primaryAction,
  trailing,
}: Props) {
  const online = isDeviceOnline(lastSeenAt, wakeIntervalSec);
  const contactTooltip = formatLastSeen(lastSeenAt);

  return (
    <Box
      sx={{
        position: "sticky",
        top: { xs: 56, sm: 64 },
        zIndex: (theme) => theme.zIndex.appBar - 1,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
        mb: 2,
        mx: -0.5,
        px: 0.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.75, sm: 1.5 },
        flexWrap: { xs: "wrap", sm: "nowrap" },
        minHeight: { xs: 48, sm: 52 },
      }}
    >
      <Tooltip title={backLabel}>
        <IconButton
          component={RouterLink}
          to={backTo}
          size="small"
          aria-label={backLabel}
          sx={{ flexShrink: 0 }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Typography
          variant={titleVariant}
          component="h1"
          noWrap
          sx={{ flexShrink: 1, minWidth: 0, fontSize: { xs: "1.1rem", sm: undefined } }}
        >
          {title}
        </Typography>
        <Tooltip title={contactTooltip}>
          <Chip
            size="small"
            label={online ? "В сети" : "Офлайн"}
            color={online ? "success" : "default"}
            sx={{ flexShrink: 0 }}
          />
        </Tooltip>
        <Box sx={{ flexShrink: 0, overflow: "hidden" }}>
          <DeviceStatusIndicators recentTelemetry={recentTelemetry} iconsOnly />
        </Box>
      </Box>

      {trailing}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
          flexShrink: 0,
          width: { xs: "100%", sm: "auto" },
          justifyContent: { xs: "flex-end", sm: "flex-start" },
          pl: { xs: 5, sm: 0 },
        }}
      >
        {secondaryActions.map((action) => (
          <HeaderButton key={action.label} action={action} />
        ))}
        <HeaderButton action={primaryAction} />
      </Box>
    </Box>
  );
}
