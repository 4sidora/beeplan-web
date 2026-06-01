import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, type Concentrator } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { ConcentratorCard } from "../components/ConcentratorCard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { BASE_STATION_NAME_PLACEHOLDER } from "../constants/baseStation";
import { useApiaryParam } from "../hooks/useApiaryParam";

export function ConcentratorsPage() {
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
    queryKey: ["concentrators", apiaryId],
    queryFn: () => api.concentrators(apiaryId!),
    enabled: apiaryId != null,
    refetchInterval: 30_000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Concentrator | null>(null);
  const [name, setName] = useState("");
  const [deleteItem, setDeleteItem] = useState<Concentrator | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (item: Concentrator) => {
    setEditItem(item);
    setName(item.name);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) return api.updateConcentrator(editItem.id, name);
      if (apiaryId == null) throw new Error("Выберите пасеку");
      return api.createConcentrator(apiaryId, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators", apiaryId] });
      setDialogOpen(false);
      showSuccess(editItem ? "Базовая станция обновлена" : "Базовая станция создана");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteConcentrator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators", apiaryId] });
      setDeleteItem(null);
      showSuccess("Базовая станция удалена");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  return (
    <>
      <PageHeader title="Базовые станции">
        <ApiarySelect value={apiaryId} onChange={setApiaryId} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
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
        <Typography color="text.secondary">Нет базовых станций.</Typography>
      ) : (
        <Grid container spacing={2}>
          {data.map((row) => (
            <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ConcentratorCard
                item={row}
                apiaryId={apiaryId}
                onEdit={() => openEdit(row)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editItem ? "Редактировать базовую станцию" : "Новая базовая станция"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название"
            margin="normal"
            placeholder={editItem ? undefined : BASE_STATION_NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          {editItem ? (
            <Button
              color="error"
              onClick={() => {
                setDialogOpen(false);
                setDeleteItem(editItem);
              }}
              sx={{ mr: "auto" }}
            >
              Удалить
            </Button>
          ) : null}
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={() => save.mutate()}
            disabled={(editItem ? !name.trim() : false) || save.isPending}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить базовую станцию?"
        message="Будут удалены все устройства этой базовой станции."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
