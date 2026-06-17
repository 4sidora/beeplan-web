import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Горизонтальная прокрутка — только для таблиц метрик/статистики. */
  scrollable?: boolean;
};

/** Обёртка для таблиц-списков объектов (без горизонтальной прокрутки по умолчанию). */
export function ResponsiveTable({ children, scrollable = false }: Props) {
  return (
    <Paper variant="outlined">
      <TableContainer
        sx={
          scrollable
            ? { overflowX: "auto", WebkitOverflowScrolling: "touch" }
            : { overflowX: "hidden" }
        }
      >
        {children}
      </TableContainer>
    </Paper>
  );
}
