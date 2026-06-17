import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { ResponsiveTable } from "../components/ResponsiveTable";
import { useSnackbar } from "../components/SnackbarProvider";
import { BASE_STATION_NAME_PLACEHOLDER } from "../constants/baseStation";
import { formatLastSeen } from "../utils/formatLastSeen";
import { isDeviceOnline } from "../utils/deviceOnline";
import { toUserFacingError } from "../utils/userFacingError";

function onlineChip(lastSeen: string | null) {
  const online = isDeviceOnline(lastSeen);
  return (
    <Tooltip title={formatLastSeen(lastSeen)}>
      <Chip
        size="small"
        label={online ? "В сети" : "Офлайн"}
        color={online ? "success" : "default"}
        sx={{ maxWidth: "100%", "& .MuiChip-label": { px: { xs: 0.75, sm: 1 }, fontSize: { xs: "0.7rem", sm: "0.8125rem" } } }}
      />
    </Tooltip>
  );
}

const listTableSx = {
  tableLayout: "fixed",
  width: "100%",
  "& .MuiTableCell-root": {
    px: { xs: 0.5, sm: 1.5 },
    py: { xs: 0.75, sm: 1 },
    fontSize: { xs: "0.8rem", sm: "0.875rem" },
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
} as const;

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
        <ResponsiveTable>
          <Table size="small" sx={listTableSx}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: "36%", sm: "34%" } }}>Название</TableCell>
                <TableCell sx={{ width: { xs: "24%", sm: "18%" } }}>Статус</TableCell>
                <TableCell align="right" sx={{ width: { xs: "14%", sm: "14%" } }}>
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    Устройств
                  </Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    Устр.
                  </Box>
                </TableCell>
                <TableCell sx={{ width: { xs: "26%", sm: "34%" } }}>Пасека</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(concentrators.data ?? []).map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  component={RouterLink}
                  to={`/devices/${row.id}`}
                  sx={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
                >
                  <TableCell>
                    <Link
                      component="span"
                      underline="hover"
                      color="primary"
                      sx={{
                        display: "block",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{onlineChip(row.last_seen_at)}</TableCell>
                  <TableCell align="right">{row.edge_device_count ?? 0}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.apiary_name ??
                        apiaries.data?.find((a) => a.id === row.apiary_id)?.name ??
                        `#${row.apiary_id}`}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ResponsiveTable>
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
