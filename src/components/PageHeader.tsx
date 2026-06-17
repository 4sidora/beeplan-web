import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, children, actions }: Props) {
  const controls = children || actions ? (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        alignItems: "center",
        width: { xs: "100%", sm: "auto" },
        "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
        "& .MuiFormControl-root": { width: { xs: "100%", sm: "auto" } },
      }}
    >
      {children}
      {actions}
    </Box>
  ) : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3 },
      }}
    >
      <Typography variant="h5" sx={{ flex: "1 1 100%", minWidth: 0, fontSize: { xs: "1.25rem", sm: undefined } }}>
        {title}
      </Typography>
      {controls}
    </Box>
  );
}
