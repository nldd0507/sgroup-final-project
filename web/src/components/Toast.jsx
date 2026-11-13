import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const ToastContext = createContext(null);
const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 200);
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 6000 : 3500);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`toast toast-${t.type}${t.leaving ? " leaving" : ""}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{t.message}</span>
              <button type="button" className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Đóng thông báo">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
