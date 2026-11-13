// Các mảnh giao diện nhỏ dùng lại ở nhiều trang
import { CircleAlert, RotateCw } from "lucide-react";
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
  const hue = [...(name || "?")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
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

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty-icon">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
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

export function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export const ROLE_LABEL = { ADMIN: "Admin", MEMBER: "Thành viên" };
