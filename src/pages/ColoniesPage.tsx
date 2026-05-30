import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api, type Colony } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { BeeBreedSelect } from "../components/BeeBreedSelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormDialog } from "../components/FormDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { useApiaryParam } from "../hooks/useApiaryParam";

export function ColoniesPage() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [apiaryId, setApiaryId] = useApiaryParam();

  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });
  useEffect(() => {
    if (apiaryId == null && apiaries.data?.[0]) {
      setApiaryId(apiaries.data[0].id);
    }
  }, [apiaryId, apiaries.data, setApiaryId]);

  const { data = [], isLoading } = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: apiaryId != null,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [beeBreed, setBeeBreed] = useState("");
  const [deleteItem, setDeleteItem] = useState<Colony | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (apiaryId == null) throw new Error("Выберите пасеку");
      return api.createColony(apiaryId, { name, bee_breed: beeBreed.trim() || null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colonies", apiaryId] });
      setDialogOpen(false);
      showSuccess("Семья создана");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteColony(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colonies", apiaryId] });
      setDeleteItem(null);
      showSuccess("Семья удалена");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  return (
    <>
      <PageHeader title="Семьи">
        <ApiarySelect value={apiaryId} onChange={setApiaryId} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setName("");
            setBeeBreed("");
            setDialogOpen(true);
          }}
          disabled={apiaryId == null}
        >
          Добавить
        </Button>
      </PageHeader>

      {apiaryId == null ? (
        <Typography color="text.secondary">Выберите пасеку.</Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Typography color="text.secondary">Нет семей в этой пасеке.</Typography>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Порода</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Link
                      component={RouterLink}
                      to={`/colonies/${row.id}?apiary_id=${row.apiary_id}`}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.bee_breed ?? "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      component={RouterLink}
                      to={`/colonies/${row.id}?apiary_id=${row.apiary_id}`}
                      title="Просмотр"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      component={RouterLink}
                      to={`/colonies/${row.id}/edit?apiary_id=${row.apiary_id}`}
                      title="Редактировать"
                    >
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
        </Paper>
      )}

      <FormDialog
        open={dialogOpen}
        title="Новая семья"
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
        <BeeBreedSelect value={beeBreed} onChange={setBeeBreed} />
      </FormDialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить семью?"
        message="Будут удалены все записи телеметрии этой семьи."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
