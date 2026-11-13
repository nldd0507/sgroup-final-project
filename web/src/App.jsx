import { Route, Routes } from "react-router";
import { ShieldAlert } from "lucide-react";
import RequireAuth from "./auth/RequireAuth.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { EmptyState } from "./components/ui.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ClassesPage from "./pages/ClassesPage.jsx";
import ClassDetailPage from "./pages/ClassDetailPage.jsx";
import LessonPage from "./pages/LessonPage.jsx";
import AssignmentPage from "./pages/AssignmentPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Ẩn trang khỏi người không phải Admin (backend vẫn chặn bằng 403)
function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user.role === "ADMIN") return children;
  return (
    <section className="panel">
      <EmptyState icon={ShieldAlert} title="Trang này chỉ dành cho Admin">
        Bạn không có quyền quản lý người dùng.
      </EmptyState>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:id" element={<ClassDetailPage />} />
          <Route path="lessons/:id" element={<LessonPage />} />
          <Route path="assignments/:id" element={<AssignmentPage />} />
          <Route
            path="users"
            element={
              <AdminOnly>
                <UsersPage />
              </AdminOnly>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
