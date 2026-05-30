import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { isWebSerialSupported } from "../components/EspWebInstallButton";

export function InstallOverviewPage() {
  const serialOk = isWebSerialSupported();

  return (
    <Box>
      <PageHeader
        title="Прошивка устройств"
        actions={
          <Typography variant="body2" color="text.secondary">
            Установка через браузер (ESPHome-style)
          </Typography>
        }
      />
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography sx={{ mb: 2 }}>
          Подключите ESP32 по USB и прошейте концентратор и ульевое устройство прямо из браузера.
          Конфигурация (Wi‑Fi, токены, MAC) запишется в прошивку автоматически при сборке.
        </Typography>
        {!serialOk && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            WebSerial недоступен. Используйте Chrome или Edge на компьютере (не Safari/Firefox).
          </Alert>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          Порядок: сначала <strong>концентратор</strong>, затем <strong>улей</strong> (edge).
        </Alert>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" component={RouterLink} to="/install/gateway">
            1. Прошить концентратор
          </Button>
          <Button variant="outlined" component={RouterLink} to="/install/edge">
            2. Прошить улей
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
