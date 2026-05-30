import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../api";
import { AppLayout } from "./AppLayout";
import { saveReturnUrl } from "../utils/returnUrl";

export function ProtectedRoute() {
  const location = useLocation();
  if (!getToken()) {
    saveReturnUrl(location.pathname + location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <AppLayout />;
}
