import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  maxWidth?: "xs" | "sm" | "md";
  children: ReactNode;
};

export function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = "Сохранить",
  cancelLabel = "Отмена",
  submitting = false,
  submitDisabled = false,
  maxWidth = "xs",
  children,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitDisabled && !submitting) onSubmit();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="contained" disabled={submitDisabled || submitting}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
