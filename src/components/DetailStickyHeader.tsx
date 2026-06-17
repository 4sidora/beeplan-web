import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
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
import { MAIN_PADDING_X, TOOLBAR_HEIGHT } from "../constants/layout";
import { useStickyWithinMain } from "../hooks/useStickyWithinMain";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";
import { DeviceStatusIndicators } from "./DeviceStatusIndicators";
import type { HeaderAction } from "./ObjectCardHeader";

function HeaderButton({ action, compact }: { action: HeaderAction; compact?: boolean }) {
  if (compact) {
    const icon =
      action.variant === "contained" ? (
        <EditIcon fontSize="small" />
      ) : (
        <SystemUpdateAltIcon fontSize="small" />
      );
    if (action.to) {
      return (
        <Tooltip title={action.label}>
          <IconButton
            component={RouterLink}
            to={action.to}
            size="small"
            color={action.variant === "contained" ? "primary" : "default"}
            onClick={action.onClick}
            aria-label={action.label}
          >
            {icon}
          </IconButton>
        </Tooltip>
      );
    }
    return (
      <Tooltip title={action.label}>
        <IconButton
          size="small"
          color={action.variant === "contained" ? "primary" : "default"}
          onClick={action.onClick}
          aria-label={action.label}
        >
          {icon}
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
  const { sentinelRef, headerRef, stuck, headerHeight } = useStickyWithinMain();
  const online = isDeviceOnline(lastSeenAt, wakeIntervalSec);
  const contactTooltip = formatLastSeen(lastSeenAt);
  const pinned = isMobile && stuck;

  const headerSx = {
    zIndex: (t: typeof theme) => t.zIndex.appBar - 1,
    bgcolor: "background.default",
    borderBottom: 1,
    borderColor: "divider",
    mb: 2,
    py: { xs: 0.75, sm: 1 },
    px: MAIN_PADDING_X,
    display: "flex",
    alignItems: "center",
    gap: { xs: 0.5, sm: 1.5 },
    flexWrap: "nowrap" as const,
    width: pinned ? "100%" : undefined,
    ...(pinned
      ? {
          position: "fixed" as const,
          top: TOOLBAR_HEIGHT.xs,
          left: 0,
          right: 0,
        }
      : {
          position: "sticky" as const,
          top: 0,
        }),
  };

  return (
    <>
      <Box ref={sentinelRef} sx={{ height: 1, mb: -1 }} aria-hidden />
      {pinned && headerHeight > 0 ? <Box sx={{ height: headerHeight, mb: 2 }} aria-hidden /> : null}
      <Box ref={headerRef} sx={headerSx}>
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
          <Tooltip title={contactTooltip}>
            <Chip
              size="small"
              label={online ? "В сети" : "Офлайн"}
              color={online ? "success" : "default"}
              sx={{
                flexShrink: 0,
                display: { xs: "none", sm: "flex" },
              }}
            />
          </Tooltip>
          <Box sx={{ flexShrink: 0, display: { xs: "none", md: "block" } }}>
            <DeviceStatusIndicators recentTelemetry={recentTelemetry} iconsOnly />
          </Box>
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
          {secondaryActions.map((action) => (
            <HeaderButton key={action.label} action={action} compact={isMobile} />
          ))}
          <HeaderButton action={primaryAction} compact={isMobile} />
        </Box>
      </Box>
    </>
  );
}
