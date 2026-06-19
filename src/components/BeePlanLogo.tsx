import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type Props = {
  variant?: "icon" | "full";
  height?: number;
  sx?: SxProps<Theme>;
};

/** Логотип BeePlan: иконка или горизонтальный вариант с названием. */
export function BeePlanLogo({ variant = "full", height = 32, sx }: Props) {
  const src = variant === "icon" ? "/beeplan-icon.svg" : "/beeplan-logo.svg";

  return (
    <Box
      component="img"
      src={src}
      alt="BeePlan"
      sx={{
        height,
        width: "auto",
        display: "block",
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}
