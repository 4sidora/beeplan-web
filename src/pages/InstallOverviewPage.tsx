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
          Подключите ESP32 по USB и прошейте базовую станцию и ульевое устройство прямо из браузера.
          Конфигурация (Wi‑Fi, токены, MAC) запишется в прошивку автоматически при сборке.
        </Typography>
        {!serialOk && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            WebSerial недоступен. Используйте Chrome или Edge на компьютере (не Safari/Firefox).
          </Alert>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          Порядок для новых устройств: сначала <strong>базовая станция</strong>, затем{" "}
          <strong>улей</strong> (edge). Уже зарегистрированные — прошивайте из списка{" "}
          <RouterLink to="/devices">устройств</RouterLink>.
        </Alert>
        <Button variant="contained" component={RouterLink} to="/devices">
          К списку устройств
        </Button>
      </Paper>
    </Box>
  );
}
