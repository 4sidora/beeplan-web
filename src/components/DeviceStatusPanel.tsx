import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import type { TelemetryPoint } from "../api";
import type { Preset } from "../utils/telemetry";
import { DeviceStatusDetails } from "./DeviceStatusDetails";
import { DeviceStatusToggle } from "./DeviceStatusToggle";

type Props = {
  title?: string;
  recentTelemetry?: TelemetryPoint[];
  signalPoints: TelemetryPoint[] | undefined;
  batteryPoints: TelemetryPoint[] | undefined;
  chartsLoading?: boolean;
  compact?: boolean;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  from: Dayjs;
  to: Dayjs;
  onFromChange: (v: Dayjs) => void;
  onToChange: (v: Dayjs) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function DeviceStatusPanel({
  title,
  recentTelemetry,
  signalPoints,
  batteryPoints,
  chartsLoading,
  compact,
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
  expanded: expandedProp,
  onExpandedChange,
}: Props) {
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = expandedProp ?? expandedInternal;

  const toggleExpanded = () => {
    const next = !expanded;
    if (expandedProp === undefined) setExpandedInternal(next);
    onExpandedChange?.(next);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <DeviceStatusToggle
        recentTelemetry={recentTelemetry}
        expanded={expanded}
        onToggle={toggleExpanded}
      />

      <Collapse in={expanded}>
        <Card variant="outlined" sx={{ mt: 1.5 }}>
          <CardContent>
            <DeviceStatusDetails
              title={title}
              signalPoints={signalPoints}
              batteryPoints={batteryPoints}
              chartsLoading={chartsLoading}
              compact={compact}
              preset={preset}
              onPresetChange={onPresetChange}
              from={from}
              to={to}
              onFromChange={onFromChange}
              onToChange={onToChange}
            />
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
}
