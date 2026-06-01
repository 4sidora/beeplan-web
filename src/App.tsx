import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getToken } from "./api";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RedirectPreserveSearch } from "./components/RedirectPreserveSearch";
import { ApiariesPage } from "./pages/ApiariesPage";
import { ColoniesPage } from "./pages/ColoniesPage";
import { ColonyDetailPage } from "./pages/ColonyDetailPage";
import { ColonyDevicesPage } from "./pages/ColonyDevicesPage";
import { ColonyEditPage } from "./pages/ColonyEditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ConcentratorDetailPage } from "./pages/ConcentratorDetailPage";
import { DevicesPage } from "./pages/DevicesPage";
import { EdgeDeviceDetailPage } from "./pages/EdgeDeviceDetailPage";
import { EdgeDeviceEditPage } from "./pages/EdgeDeviceEditPage";
import { EdgeInstallPage } from "./pages/EdgeInstallPage";
import { SerialMonitorPage } from "./pages/SerialMonitorPage";
import { GatewayInstallPage } from "./pages/GatewayInstallPage";
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
        <Route path="devices" element={<DevicesPage />} />
        <Route path="devices/monitor" element={<SerialMonitorPage />} />
        <Route path="devices/install/gateway" element={<GatewayInstallPage />} />
        <Route path="devices/install/edge" element={<EdgeInstallPage />} />
        <Route path="devices/edge/:deviceId/edit" element={<EdgeDeviceEditPage />} />
        <Route path="devices/edge/:deviceId" element={<EdgeDeviceDetailPage />} />
        <Route path="devices/:concentratorId" element={<ConcentratorDetailPage />} />
        <Route path="telemetry" element={<TelemetryPage />} />
        <Route path="concentrators" element={<Navigate to="/devices" replace />} />
        <Route path="install/gateway" element={<RedirectPreserveSearch to="/devices/install/gateway" />} />
        <Route path="install/edge" element={<RedirectPreserveSearch to="/devices/install/edge" />} />
        <Route path="install" element={<Navigate to="/devices" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
