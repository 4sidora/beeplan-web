import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "../utils/telemetry";

type SingleProps = {
  variant: "single";
  title: string;
  data: Record<string, string | number>[];
  dataKey: string;
  unit: string;
  color?: string;
};

type MultiProps = {
  variant: "multi";
  title: string;
  data: Record<string, string | number>[];
  series: { dataKey: string; name: string }[];
};

type Props = SingleProps | MultiProps;

export function TelemetryChart(props: Props) {
  const { title, data } = props;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary">Нет данных за выбранный период</Typography>
      ) : (
        <Box sx={{ width: "100%", height: 280, minHeight: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={32} tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} unit={props.variant === "single" ? props.unit : undefined} />
              <Tooltip />
              <Legend />
              {props.variant === "single" ? (
                <Line
                  type="monotone"
                  dataKey={props.dataKey}
                  name={props.unit}
                  dot={false}
                  strokeWidth={2}
                  stroke={props.color ?? CHART_COLORS[0]}
                />
              ) : (
                props.series.map((s, i) => (
                  <Line
                    key={s.dataKey}
                    type="monotone"
                    dataKey={s.dataKey}
                    name={s.name}
                    dot={false}
                    strokeWidth={2}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
}
