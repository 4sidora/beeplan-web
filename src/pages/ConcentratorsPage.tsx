import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, type Concentrator } from "../api";
import { ApiarySelect } from "../components/ApiarySelect";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
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
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Concentrator | null>(null);
  const [name, setName] = useState("");
  const [deleteItem, setDeleteItem] = useState<Concentrator | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const openCreate = () => {
    setEditItem(null);
    setName("");
    setNewToken(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Concentrator) => {
    setEditItem(item);
    setName(item.name);
    setNewToken(null);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editItem) return api.updateConcentrator(editItem.id, name);
      if (apiaryId == null) throw new Error("Выберите пасеку");
      return api.createConcentrator(apiaryId, name);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["concentrators", apiaryId] });
      if (!editItem) setNewToken(result.ingest_token);
      else {
        setDialogOpen(false);
        showSuccess("Концентратор обновлён");
      }
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteConcentrator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators", apiaryId] });
      setDeleteItem(null);
      showSuccess("Концентратор удалён");
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showSuccess("Токен скопирован");
    } catch {
      showError("Не удалось скопировать");
    }
  };

  return (
    <>
      <PageHeader title="Концентраторы">
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
        <Typography color="text.secondary">Нет концентраторов.</Typography>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Ingest token</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {row.ingest_token.slice(0, 8)}…
                      </Typography>
                      <Tooltip title="Скопировать токен">
                        <IconButton size="small" onClick={() => copyToken(row.ingest_token)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
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
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editItem ? "Редактировать концентратор" : "Новый концентратор"}</DialogTitle>
        <DialogContent>
          {newToken && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Ingest token (сохраните для gateway):{" "}
              <Typography component="span" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {newToken}
              </Typography>
              <Button size="small" startIcon={<ContentCopyIcon />} sx={{ ml: 1 }} onClick={() => copyToken(newToken)}>
                Копировать
              </Button>
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Название"
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {newToken ? "Закрыть" : "Отмена"}
          </Button>
          {!newToken && (
            <Button variant="contained" onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>
              Сохранить
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteItem != null}
        title="Удалить концентратор?"
        message="Будут удалены все устройства этого концентратора."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => deleteItem && remove.mutate(deleteItem.id)}
        loading={remove.isPending}
      />
    </>
  );
}
