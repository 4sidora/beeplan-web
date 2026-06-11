import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";

export type HeaderAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant: "outlined" | "contained";
};

type Props = {
  title: string;
  lastSeenAt: string | null | undefined;
  /** Интервал замера edge, с; для gateway не передавать. */
  wakeIntervalSec?: number | null;
  titleVariant?: "h5" | "h6";
  secondaryActions?: HeaderAction[];
  primaryAction: HeaderAction;
};

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

export function ObjectCardHeader({
  title,
  lastSeenAt,
  wakeIntervalSec,
  titleVariant = "h6",
  secondaryActions = [],
  primaryAction,
}: Props) {
  const online = isDeviceOnline(lastSeenAt, wakeIntervalSec);
  const contactTooltip = formatLastSeen(lastSeenAt);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 1,
        mb: 1.5,
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
        <Typography variant={titleVariant} component="h2">
          {title}
        </Typography>
        <Tooltip title={contactTooltip}>
          <Chip size="small" label={online ? "В сети" : "Офлайн"} color={online ? "success" : "default"} />
        </Tooltip>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "flex-end", flexShrink: 0 }}>
        {secondaryActions.map((action) => (
          <HeaderButton key={action.label} action={action} />
        ))}
        <HeaderButton action={primaryAction} />
      </Box>
    </Box>
  );
}
