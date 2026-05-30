import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

export function DashboardPage() {
  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries });
  const firstApiaryId = apiaries.data?.[0]?.id ?? null;

  const colonies = useQuery({
    queryKey: ["colonies", firstApiaryId],
    queryFn: () => api.colonies(firstApiaryId!),
    enabled: firstApiaryId != null,
  });

  const devices = useQuery({
    queryKey: ["edge-devices", firstApiaryId],
    queryFn: () => api.edgeDevices(firstApiaryId!),
    enabled: firstApiaryId != null,
  });

  const stats = [
    { label: "Пасеки", value: apiaries.data?.length ?? "—" },
    {
      label: "Семьи (первая пасека)",
      value: firstApiaryId != null ? (colonies.data?.length ?? "…") : "—",
    },
    {
      label: "Устройства (первая пасека)",
      value: firstApiaryId != null ? (devices.data?.length ?? "…") : "—",
    },
  ];

  return (
    <>
      <PageHeader title="Главная" />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Card key={s.label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {s.label}
              </Typography>
              <Typography variant="h4">{s.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Быстрые ссылки
      </Typography>
      <Button component={RouterLink} to="/apiaries" sx={{ mr: 1 }}>
        Пасеки
      </Button>
      <Button component={RouterLink} to="/telemetry" sx={{ mr: 1 }}>
        Телеметрия
      </Button>
      <Button component={RouterLink} to="/devices">
        Устройства
      </Button>
    </>
  );
}
