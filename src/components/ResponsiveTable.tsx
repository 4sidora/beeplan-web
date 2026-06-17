import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Paper + horizontal scroll for wide tables on phones. */
export function ResponsiveTable({ children }: Props) {
  return (
    <Paper>
      <TableContainer sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {children}
      </TableContainer>
    </Paper>
  );
}
