import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { Dayjs } from "dayjs";
import type { Preset } from "../utils/telemetry";

type Props = {
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  from: Dayjs;
  to: Dayjs;
  onFromChange: (v: Dayjs) => void;
  onToChange: (v: Dayjs) => void;
  /** Без обёртки Paper — для вложения в Card. */
  embedded?: boolean;
};

const PRESETS: { key: Preset; label: string }[] = [
  { key: "1h", label: "1 ч" },
  { key: "24h", label: "24 ч" },
  { key: "7d", label: "7 дней" },
  { key: "14d", label: "14 дней" },
  { key: "30d", label: "30 дней" },
  { key: "custom", label: "Произвольный" },
];

export function PeriodSelector({
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
  embedded,
}: Props) {
  const content = (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Период
      </Typography>
      <ButtonGroup size="small" sx={{ mb: 2, flexWrap: "wrap" }}>
        {PRESETS.map(({ key, label }) => (
          <Button
            key={key}
            variant={preset === key ? "contained" : "outlined"}
            onClick={() => onPresetChange(key)}
          >
            {label}
          </Button>
        ))}
      </ButtonGroup>
      {preset === "custom" ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <DateTimePicker
            label="С"
            value={from}
            onChange={(v) => v && onFromChange(v)}
            slotProps={{ textField: { size: "small" } }}
          />
          <DateTimePicker
            label="По"
            value={to}
            onChange={(v) => v && onToChange(v)}
            slotProps={{ textField: { size: "small" } }}
          />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {from.format("DD.MM.YYYY HH:mm")} — {to.format("DD.MM.YYYY HH:mm")}
        </Typography>
      )}
    </>
  );

  if (embedded) {
    return <Box sx={{ mb: 2 }}>{content}</Box>;
  }

  return <Paper sx={{ p: 2, mb: 2 }}>{content}</Paper>;
}
