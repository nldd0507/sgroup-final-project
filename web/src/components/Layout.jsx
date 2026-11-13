import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { BookOpenText, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTheme } from "../lib/useTheme.js";
import { Avatar, ROLE_LABEL } from "./ui.jsx";

// roles: ai thấy mục này trên menu (bỏ trống = mọi người)
const NAV = [{ to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true }];

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        S
      </span>
      <span className="logo-text">
        SGroup <b>Learning</b>
      </span>
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Đổi trang trên điện thoại thì đóng menu
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = NAV.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="shell">
      <aside className={`sidebar${open ? " open" : ""}`} aria-label="Điều hướng chính">
        <div className="sidebar-top">
          <Logo />
          <button type="button" className="icon-btn only-mobile" onClick={() => setOpen(false)} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        <nav className="nav">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          <a className="nav-link" href="/docs" target="_blank" rel="noopener noreferrer">
            <BookOpenText size={18} aria-hidden="true" />
            <span>Tài liệu API</span>
          </a>
        </nav>

        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={user.name} />
            <div className="me-text">
              <span className="me-name">{user.name}</span>
              <span className="me-role">{ROLE_LABEL[user.role] ?? user.role}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={toggle}>
              {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              {theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="scrim" hidden={!open} onClick={() => setOpen(false)} />

      <div className="main-col">
        <header className="topbar">
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Mở menu">
            <Menu size={22} />
          </button>
          <Logo />
        </header>
        <main className="content">
          <div key={location.pathname} className="page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
