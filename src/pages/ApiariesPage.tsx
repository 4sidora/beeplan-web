import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Apiary } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormDialog } from "../components/FormDialog";
import { PageHeader } from "../components/PageHeader";
import { ResponsiveTable } from "../components/ResponsiveTable";
import { useSnackbar } from "../components/SnackbarProvider";

export function ApiariesPage() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const { data = [], isLoading } = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Apiary | null>(null);
  const [name, setName] = useState("");
  const [deleteItem, setDeleteItem] = useState<Apiary | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (item: Apiary) => {
    setEditItem(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) return api.updateApiary(editItem.id, name);
      return api.createApiary(name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apiaries"] });
      setDialogOpen(false);
      showSuccess(editItem ? "Пасека обновлена" : "Пасека создана");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteApiary(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apiaries"] });
      setDeleteItem(null);
      showSuccess("Пасека удалена");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  return (
    <>
      <PageHeader
        title="Пасеки"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Добавить
          </Button>
        }
      />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Typography color="text.secondary">Нет пасек. Создайте первую.</Typography>
      ) : (
        <ResponsiveTable>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteItem(row)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
      )}

      <FormDialog
        open={dialogOpen}
        title={editItem ? "Редактировать пасеку" : "Новая пасека"}
        onClose={() => setDialogOpen(false)}
        onSubmit={() => save.mutate()}
        submitting={save.isPending}
        submitDisabled={!name.trim()}
      >
        <TextField
          autoFocus
          fullWidth
          label="Название"
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить пасеку?"
        message="Будут удалены все семьи, базовые станции, устройства и телеметрия этой пасеки."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
