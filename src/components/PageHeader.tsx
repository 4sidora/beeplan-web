import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, children, actions }: Props) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3 }}>
      <Typography variant="h5" sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      {children}
      {actions}
    </Box>
  );
}
