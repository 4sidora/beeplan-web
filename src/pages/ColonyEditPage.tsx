import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { BeeBreedSelect } from "../components/BeeBreedSelect";
import { PageHeader } from "../components/PageHeader";
import { useSnackbar } from "../components/SnackbarProvider";
import { useApiaryParam } from "../hooks/useApiaryParam";

export function ColonyEditPage() {
  const { colonyId: rawId } = useParams();
  const colonyId = rawId ? Number(rawId) : NaN;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showSuccess, showError } = useSnackbar();
  const [, setApiaryId] = useApiaryParam();

  const colony = useQuery({
    queryKey: ["colony", colonyId],
    queryFn: () => api.colony(colonyId),
    enabled: Number.isFinite(colonyId),
  });

  const [name, setName] = useState("");
  const [beeBreed, setBeeBreed] = useState("");

  useEffect(() => {
    if (colony.data) {
      setName(colony.data.name);
      setBeeBreed(colony.data.bee_breed ?? "");
      setApiaryId(colony.data.apiary_id);
    }
  }, [colony.data, setApiaryId]);

  const save = useMutation({
    mutationFn: () =>
      api.updateColony(colonyId, { name, bee_breed: beeBreed.trim() || null }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["colonies", data.apiary_id] });
      qc.invalidateQueries({ queryKey: ["colony", colonyId] });
      showSuccess("Семья сохранена");
      navigate(`/colonies/${colonyId}?apiary_id=${data.apiary_id}`);
    },
    onError: (e) => showError(String((e as Error).message)),
  });

  const detailPath =
    colony.data != null ? `/colonies/${colony.data.id}?apiary_id=${colony.data.apiary_id}` : "/colonies";

  useEffect(() => {
    if (!colony.data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(detailPath);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, detailPath, colony.data]);

  if (colony.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (colony.isError || !colony.data) {
    return <Typography color="error">Семья не найдена</Typography>;
  }

  const c = colony.data;

  return (
    <>
      <PageHeader title={`Редактирование: ${c.name}`} />
      <Paper
        component="form"
        sx={{ p: 3, maxWidth: 480 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && !save.isPending) save.mutate();
        }}
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
        <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
          <Button type="submit" variant="contained" disabled={!name.trim() || save.isPending}>
            Сохранить
          </Button>
          <Button component={RouterLink} to={detailPath}>
            Отмена
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
          Enter — сохранить, Esc — отмена (кнопка «Отмена»)
        </Typography>
      </Paper>
    </>
  );
}
