import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { api, getToken, setToken } from "./api";

function LoginPanel() {
  const [email, setEmail] = useState("dev@beeplan.local");
  const [password, setPassword] = useState("devpassword");
  const m = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (data) => {
      setToken(data.access_token);
      window.location.reload();
    },
  });
  return (
    <div style={{ maxWidth: 360 }}>
      <h2>Вход BeePlan</h2>
      <p style={{ color: "#555", fontSize: 14 }}>
        Используйте учётную запись из <code>seed_dev</code> или зарегистрируйтесь через API{" "}
        <code>/v1/auth/register</code>.
      </p>
      <label style={{ display: "block", marginBottom: 8 }}>
        Email
        <input
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Пароль
        <input
          type="password"
          style={{ width: "100%", padding: 8, marginTop: 4 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="button" style={{ padding: "8px 16px" }} onClick={() => m.mutate()}>
        Войти
      </button>
      {m.isError && (
        <p style={{ color: "crimson", marginTop: 8 }}>{String((m.error as Error).message)}</p>
      )}
    </div>
  );
}

function numericFromValue(metric: string, value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (metric === "temperature_c" && typeof v.celsius === "number") return v.celsius;
  if (metric === "relative_humidity" && typeof v.percent === "number") return v.percent;
  return null;
}

export default function App() {
  const authed = !!getToken();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me, enabled: authed });
  const apiaries = useQuery({ queryKey: ["apiaries"], queryFn: api.apiaries, enabled: authed });
  const [apiaryId, setApiaryId] = useState<number | null>(null);
  const colonies = useQuery({
    queryKey: ["colonies", apiaryId],
    queryFn: () => api.colonies(apiaryId!),
    enabled: authed && apiaryId != null,
  });
  const [colonyId, setColonyId] = useState<number | null>(null);
  const telemetry = useQuery({
    queryKey: ["telemetry", colonyId],
    queryFn: () => api.telemetry(colonyId!),
    enabled: authed && colonyId != null,
  });

  const chartData = useMemo(() => {
    const rows = telemetry.data ?? [];
    const temp = rows
      .filter((r) => r.metric === "temperature_c")
      .map((r) => ({
        ts: new Date(r.ts).getTime(),
        label: new Date(r.ts).toLocaleString(),
        temperature: numericFromValue(r.metric, r.value),
      }))
      .filter((r) => r.temperature != null)
      .sort((a, b) => a.ts - b.ts);
    return temp;
  }, [telemetry.data]);

  if (!authed) {
    return (
      <div style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1>BeePlan</h1>
        <LoginPanel />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 960 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>BeePlan</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#555" }}>{me.data?.email}</span>
          <button
            type="button"
            onClick={() => {
              setToken(null);
              window.location.reload();
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <h2>Пасека</h2>
        <select
          value={apiaryId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setApiaryId(v);
            setColonyId(null);
          }}
        >
          <option value="">— выберите —</option>
          {(apiaries.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Семья</h2>
        <select
          value={colonyId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setColonyId(v);
          }}
          disabled={!apiaryId}
        >
          <option value="">— выберите —</option>
          {(colonies.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Температура (°C)</h2>
        {telemetry.isLoading && <p>Загрузка…</p>}
        {telemetry.isError && <p style={{ color: "crimson" }}>{String((telemetry.error as Error).message)}</p>}
        {chartData.length === 0 && telemetry.isSuccess && <p>Нет точек temperature_c</p>}
        {chartData.length > 0 && (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" name="°C" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
