import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { TelemetryPoint } from "../api";
import { MAIN_PADDING_X, MAIN_PADDING_X_NEG } from "../constants/layout";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";
import { DeviceOnlineDot } from "./DeviceOnlineDot";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";
import type { HeaderAction } from "./ObjectCardHeader";

function HeaderButton({ action, compact }: { action: HeaderAction; compact?: boolean }) {
  if (compact) {
    if (action.to) {
      return (
        <Tooltip title={action.label}>
          <IconButton
            component={RouterLink}
            to={action.to}
            size="small"
            color="primary"
            onClick={action.onClick}
            aria-label={action.label}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    return (
      <Tooltip title={action.label}>
        <IconButton
          size="small"
          color="primary"
          onClick={action.onClick}
          aria-label={action.label}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

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

/** Шапка детальной страницы: назад, заголовок, статус и действия. */
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const online = isDeviceOnline(lastSeenAt, wakeIntervalSec);
  const contactTooltip = formatLastSeen(lastSeenAt);
  const visibleSecondary = isMobile ? [] : secondaryActions;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar - 1,
        bgcolor: "background.default",
        borderBottom: 1,
        borderColor: "divider",
        mb: 2,
        py: { xs: 0.75, sm: 1 },
        mx: MAIN_PADDING_X_NEG,
        px: MAIN_PADDING_X,
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.5, sm: 1.5 },
        flexWrap: "nowrap",
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
          gap: { xs: 0.5, sm: 1 },
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Typography
          variant={titleVariant}
          component="h1"
          noWrap
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: { xs: "1rem", sm: undefined },
          }}
        >
          {title}
        </Typography>
        {isMobile ? (
          <>
            <DeviceOnlineDot lastSeenAt={lastSeenAt} wakeIntervalSec={wakeIntervalSec} />
            <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <DeviceStatusIndicators recentTelemetry={recentTelemetry} iconsOnly />
            </Box>
          </>
        ) : (
          <>
            <Tooltip title={contactTooltip}>
              <Chip
                size="small"
                label={online ? "В сети" : "Офлайн"}
                color={online ? "success" : "default"}
                sx={{ flexShrink: 0 }}
              />
            </Tooltip>
            <Box sx={{ flexShrink: 0 }}>
              <DeviceStatusIndicators recentTelemetry={recentTelemetry} iconsOnly />
            </Box>
          </>
        )}
      </Box>

      {trailing}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          gap: 0.25,
        }}
      >
        {visibleSecondary.map((action) => (
          <HeaderButton key={action.label} action={action} compact={false} />
        ))}
        <HeaderButton action={primaryAction} compact={isMobile} />
      </Box>
    </Box>
  );
}
