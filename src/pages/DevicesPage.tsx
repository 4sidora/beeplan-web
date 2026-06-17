import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api";
import { ConcentratorCard } from "../components/ConcentratorCard";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { BASE_STATION_NAME_PLACEHOLDER } from "../constants/baseStation";
import { toUserFacingError } from "../utils/userFacingError";

export function DevicesPage() {
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const theme = useTheme();
  const dialogFullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });

  const concentrators = useQuery({
    queryKey: ["concentrators-all", apiaries.data],
    queryFn: () => api.allConcentrators(),
    refetchInterval: 60_000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [apiaryId, setApiaryId] = useState<number | "">("");
  const [nameLoading, setNameLoading] = useState(false);

  const openCreate = async () => {
    setApiaryId(apiaries.data?.[0]?.id ?? "");
    setDialogOpen(true);
    setNameLoading(true);
    setName("");
    try {
      const suggested = await api.suggestedBaseStationName();
      setName(suggested.name);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Не удалось сгенерировать название");
    } finally {
      setNameLoading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      if (apiaryId === "") throw new Error("Выберите пасеку");
      return api.createConcentrator(Number(apiaryId), name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["concentrators-all"] });
      setDialogOpen(false);
      showSuccess("Базовая станция создана");
    },
    onError: (e) => showError(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  function apiaryLabel(apiaryId: number, apiaryName?: string | null) {
    return apiaryName ?? apiaries.data?.find((a) => a.id === apiaryId)?.name ?? `#${apiaryId}`;
  }

  return (
    <>
      <PageHeader title="Устройства">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Добавить базовую станцию
        </Button>
      </PageHeader>

      {concentrators.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {toUserFacingError(concentrators.error, "Не удалось загрузить базовые станции")}
        </Alert>
      ) : null}

      {concentrators.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (concentrators.data ?? []).length === 0 ? (
        <Alert severity="info">Добавьте первую базовую станцию.</Alert>
      ) : (
        <Grid container spacing={2}>
          {(concentrators.data ?? []).map((row) => (
            <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ConcentratorCard item={row} apiaryLabel={apiaryLabel(row.apiary_id, row.apiary_name)} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth fullScreen={dialogFullScreen} maxWidth="sm">
        <DialogTitle>Новая базовая станция</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название"
            margin="normal"
            placeholder={BASE_STATION_NAME_PLACEHOLDER}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={nameLoading}
            slotProps={
              nameLoading
                ? {
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ),
                    },
                  }
                : undefined
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="apiary-pick">Пасека</InputLabel>
            <Select
              labelId="apiary-pick"
              label="Пасека"
              value={apiaryId}
              onChange={(e) => setApiaryId(Number(e.target.value))}
            >
              {(apiaries.data ?? []).map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={() => save.mutate()}
            disabled={apiaryId === "" || nameLoading || !name.trim() || save.isPending}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
