import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";

type Props = {
  lastSeenAt: string | null | undefined;
  /** Интервал замера edge, с; для gateway не передавать. */
  wakeIntervalSec?: number | null;
};

export function DeviceOnlineDot({ lastSeenAt, wakeIntervalSec }: Props) {
  const online = isDeviceOnline(lastSeenAt, wakeIntervalSec);
  const tooltip = formatLastSeen(lastSeenAt);

  return (
    <Tooltip title={tooltip}>
      <Box
        component="span"
        role="img"
        aria-label={online ? "В сети" : "Офлайн"}
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: online ? "success.main" : "error.main",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
    </Tooltip>
  );
}
