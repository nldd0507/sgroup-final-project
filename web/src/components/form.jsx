import { useCallback, useState } from "react";

// Ô nhập có nhãn, gợi ý và lỗi. `as` = "input" | "textarea" | "select"
export function Field({ id, label, hint, error, as: Tag = "input", children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        className="input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {error ? (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

// Trạng thái form nhỏ gọn: giá trị, lỗi theo từng ô, lỗi chung từ server, đang gửi
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = useCallback(
    (name) => (e) => {
      const value = e?.target ? e.target.value : e;
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((er) => (er[name] ? { ...er, [name]: undefined } : er));
    },
    []
  );

  const reset = useCallback((next) => {
    setValues(next);
    setErrors({});
    setFormError("");
    setBusy(false);
  }, []);

  // validate(values) trả object lỗi; rỗng thì gọi action
  const submit = useCallback(
    async (validate, action) => {
      const found = validate ? validate(values) : {};
      const clean = Object.fromEntries(Object.entries(found).filter(([, v]) => v));
      setErrors(clean);
      setFormError("");
      if (Object.keys(clean).length) return false;
      setBusy(true);
      try {
        await action(values);
        setBusy(false);
        return true;
      } catch (err) {
        setFormError(err.message);
        setBusy(false);
        return false;
      }
    },
    [values]
  );

  return { values, set, errors, formError, busy, submit, reset, setValues };
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  );
}

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
export const isHttpUrl = (s) => {
  try {
    const u = new URL(s.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
};
