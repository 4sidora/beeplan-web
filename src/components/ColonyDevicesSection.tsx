import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { FormDialog } from "./FormDialog";
import { ResponsiveTable } from "./ResponsiveTable";
import { EDGE_DEVICE_NAME_PLACEHOLDER } from "../constants/edgeDevice";
import { EDGE_DEVICE_METRICS_LABEL } from "../utils/colonyCatalog";

type Props = {
  colonyId: number;
  apiaryId: number;
  showTitle?: boolean;
};

export function ColonyDevicesSection({ colonyId, apiaryId, showTitle = true }: Props) {
  const qc = useQueryClient();

  const concentrators = useQuery({
    queryKey: ["concentrators", apiaryId],
    queryFn: () => api.concentrators(apiaryId),
  });

  const { data: allDevices = [], isLoading } = useQuery({
    queryKey: ["edge-devices", apiaryId],
    queryFn: () => api.edgeDevices(apiaryId),
  });

  const devices = allDevices.filter((d) => d.current_colony_id === colonyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [concentratorId, setConcentratorId] = useState<number | "">("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setDeviceName("");
    setConcentratorId(concentrators.data?.[0]?.id ?? "");
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (concentratorId === "") throw new Error("Выберите базовую станцию");
      return api.createEdgeDevice({
        concentrator_id: Number(concentratorId),
        name: deviceName.trim() || null,
        colony_id: colonyId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["edge-devices", apiaryId] });
      setDialogOpen(false);
      setErrorMsg(null);
    },
    onError: (e) => setErrorMsg(String((e as Error).message)),
  });

  return (
    <Box sx={{ mb: 3 }}>
      {showTitle && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6">Подключённые устройства</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!concentrators.data?.length}
          >
            Добавить устройство
          </Button>
        </Box>
      )}

      {!showTitle && (
        <Box sx={{ mb: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!concentrators.data?.length}
          >
            Добавить устройство
          </Button>
        </Box>
      )}

      {errorMsg && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {!concentrators.data?.length ? (
        <Typography color="text.secondary">Сначала создайте базовую станцию для этой пасеки.</Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : devices.length === 0 ? (
        <Typography color="text.secondary">Нет привязанных устройств.</Typography>
      ) : (
        <ResponsiveTable>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Public ID</TableCell>
                <TableCell>Базовая станция</TableCell>
                <TableCell>Данные</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name ?? row.public_id}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{row.public_id}</TableCell>
                  <TableCell>{row.concentrator_name ?? `ID ${row.concentrator_id}`}</TableCell>
                  <TableCell>
                    <Chip size="small" label={EDGE_DEVICE_METRICS_LABEL} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      component={RouterLink}
                      to={`/devices/edge/${row.id}/edit`}
                      title="Редактировать"
                    >
                      <EditIcon fontSize="small" />
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
        title="Новое устройство"
        onClose={() => setDialogOpen(false)}
        onSubmit={() => save.mutate()}
        submitting={save.isPending}
        submitDisabled={concentratorId === ""}
        maxWidth="sm"
      >
        <FormControl fullWidth margin="normal">
          <InputLabel id="conc-label">Базовая станция</InputLabel>
          <Select
            labelId="conc-label"
            label="Базовая станция"
            value={concentratorId}
            onChange={(e) => setConcentratorId(Number(e.target.value))}
          >
            {(concentrators.data ?? []).map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          autoFocus
          fullWidth
          label="Название"
          margin="normal"
          placeholder={EDGE_DEVICE_NAME_PLACEHOLDER}
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />
      </FormDialog>
    </Box>
  );
}
