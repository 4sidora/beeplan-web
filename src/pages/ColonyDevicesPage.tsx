import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import { api } from "../api";

/** Устаревший маршрут: перенаправление на карточку семьи. */
export function ColonyDevicesPage() {
  const { colonyId: rawId } = useParams();
  const colonyId = rawId ? Number(rawId) : NaN;

  const colony = useQuery({
    queryKey: ["colony", colonyId],
    queryFn: () => api.colony(colonyId),
    enabled: Number.isFinite(colonyId),
  });

  if (colony.isError) {
    return <Typography color="error">Семья не найдена</Typography>;
  }

  if (colony.data) {
    return (
      <Navigate
        to={`/colonies/${colony.data.id}?apiary_id=${colony.data.apiary_id}`}
        replace
      />
    );
  }

  return null;
}
