import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, X } from "lucide-react";
import { Spinner } from "./ui.jsx";

// Hộp thoại: Esc hoặc bấm ra ngoài để đóng (trừ khi đang lưu), tự focus ô đầu tiên
export default function Modal({ open, title, description, onClose, busy = false, width, children, footer, onSubmit }) {
  const boxRef = useRef(null);
  // Giữ bản mới nhất trong ref để effect chỉ chạy khi mở/đóng, không chạy lại mỗi lần gõ phím
  const latest = useRef({ busy, onClose });
  latest.current = { busy, onClose };

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const onKey = (e) => e.key === "Escape" && !latest.current.busy && latest.current.onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const first = boxRef.current?.querySelector("input:not([type=hidden]), textarea, select, button.btn-primary");
    first?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const Body = onSubmit ? "form" : "div";
  const bodyProps = onSubmit
    ? {
        onSubmit: (e) => {
          e.preventDefault();
          if (!busy) onSubmit();
        },
        noValidate: true,
      }
    : {};

  return createPortal(
    <div className="modal-root">
      <div className="modal-backdrop" onClick={() => !busy && onClose()} />
      <Body
        ref={boxRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={width ? { "--modal-w": `${width}px` } : undefined}
        {...bodyProps}
      >
        <div className="modal-head">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={busy} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </Body>
    </div>,
    document.body
  );
}

// Nút Hủy + nút chính, dùng cho chân modal có form
export function ModalActions({ onCancel, busy, submitLabel, danger = false, disabled = false }) {
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
        Hủy
      </button>
      <button type="submit" className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={busy || disabled}>
        {busy && <Spinner size={14} />}
        {submitLabel}
      </button>
    </>
  );
}

// Hộp xác nhận trước khi xóa
export function ConfirmModal({ open, title, children, confirmLabel = "Xóa", busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      busy={busy}
      width={440}
      onSubmit={onConfirm}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={confirmLabel} danger />}
    >
      <div className="notice warn">
        <TriangleAlert size={18} aria-hidden="true" />
        <div>{children}</div>
      </div>
    </Modal>
  );
}
