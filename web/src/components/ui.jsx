// Các mảnh giao diện nhỏ dùng lại ở nhiều trang
import { Link } from "react-router";
import { ChevronRight, CircleAlert, RotateCw } from "lucide-react";
import { initials } from "../lib/format.js";

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function FullPageLoader() {
  return (
    <div className="full-loader" role="status">
      <Spinner size={28} />
      <span>Đang tải…</span>
    </div>
  );
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function Avatar({ name, size = 36 }) {
  // Màu nền cố định theo tên để mỗi người luôn một màu
  const hue = hueOf(name || "?");
  return (
    <span className="avatar" style={{ width: size, height: size, "--hue": hue, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Chip({ tone = "neutral", children }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}>
      <span style={{ "--value": `${v}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty-icon">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <CircleAlert size={20} aria-hidden="true" />
      <div>
        <p className="error-title">Không tải được dữ liệu</p>
        <p className="error-text">{error?.message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          <RotateCw size={16} aria-hidden="true" /> Thử lại
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, lead, crumbs, children }) {
  return (
    <header className="page-header">
      <div>
        {crumbs && <Crumbs items={crumbs} />}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

// items: [{ to, label }], mục cuối không có link
export function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Đường dẫn">
      {items.map((item, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// tabs: [{ key, label, count }]
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          className="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
        >
          {t.icon && <t.icon size={16} aria-hidden="true" />}
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Score({ value, max, big = false }) {
  return (
    <span className={`score${big ? " score-big" : ""}`}>
      {value}
      <small>/{max}</small>
    </span>
  );
}

// Màu cố định theo chuỗi (tên lớp, tên người) để mỗi thứ luôn một màu
export const hueOf = (text = "") => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

export const ROLE_LABEL = { ADMIN: "Admin", MEMBER: "Thành viên" };
