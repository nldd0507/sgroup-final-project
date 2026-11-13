import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { FullPageLoader } from "../components/ui.jsx";

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "guest") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
