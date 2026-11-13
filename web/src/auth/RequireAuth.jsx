import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { FullPageLoader } from "../components/ui.jsx";

export default function RequireAuth() {
  const { status, endedBy } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "guest") {
    // Mở link khi chưa đăng nhập hoặc phiên hết hạn: đăng nhập xong quay lại đúng trang đó
    const state = endedBy === "logout" ? undefined : { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
