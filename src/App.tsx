import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getToken } from "./api";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ApiariesPage } from "./pages/ApiariesPage";
import { ColoniesPage } from "./pages/ColoniesPage";
import { ColonyDetailPage } from "./pages/ColonyDetailPage";
import { ColonyDevicesPage } from "./pages/ColonyDevicesPage";
import { ColonyEditPage } from "./pages/ColonyEditPage";
import { ConcentratorsPage } from "./pages/ConcentratorsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { EdgeInstallPage } from "./pages/EdgeInstallPage";
import { GatewayInstallPage } from "./pages/GatewayInstallPage";
import { InstallOverviewPage } from "./pages/InstallOverviewPage";
import { LoginPage } from "./pages/LoginPage";
import { TelemetryPage } from "./pages/TelemetryPage";
import { returnPathFromState } from "./utils/returnUrl";

function LoginRedirect() {
  const location = useLocation();
  if (getToken()) {
    const target = returnPathFromState(location.state?.from) || "/";
    return <Navigate to={target} replace />;
  }
  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="apiaries" element={<ApiariesPage />} />
        <Route path="colonies" element={<ColoniesPage />} />
        <Route path="colonies/:colonyId/edit" element={<ColonyEditPage />} />
        <Route path="colonies/:colonyId/devices" element={<ColonyDevicesPage />} />
        <Route path="colonies/:colonyId" element={<ColonyDetailPage />} />
        <Route path="concentrators" element={<ConcentratorsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="telemetry" element={<TelemetryPage />} />
        <Route path="install" element={<InstallOverviewPage />} />
        <Route path="install/gateway" element={<GatewayInstallPage />} />
        <Route path="install/edge" element={<EdgeInstallPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
