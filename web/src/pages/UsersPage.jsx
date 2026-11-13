import { useMemo, useState } from "react";
import { Pencil, Search, UserPlus, Users } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { formatDay } from "../lib/format.js";
import { Avatar, Chip, EmptyState, ErrorState, PageHeader, ROLE_LABEL, Skeleton } from "../components/ui.jsx";
import Modal, { ModalActions } from "../components/Modal.jsx";
import { Field, FormError, isEmail, useForm } from "../components/form.jsx";
import { useToast } from "../components/Toast.jsx";

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "ADMIN", label: "Admin" },
  { key: "MEMBER", label: "Thành viên" },
];

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data: users, error, loading, reload } = useAsync(() => api.get("/users"), []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | user

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, role]);

  return (
    <>
      <PageHeader title="Người dùng" lead="Tài khoản do Admin cấp. Mentor là thành viên được chỉ định phụ trách một lớp.">
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <UserPlus size={17} aria-hidden="true" /> Tạo tài khoản
        </button>
      </PageHeader>

      <div className="toolbar">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên hoặc email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm người dùng"
          />
        </label>
        <div className="segmented" role="group" aria-label="Lọc theo vai trò">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={role === f.key} onClick={() => setRole(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="spacer" />
        {users && (
          <span className="muted small">
            {visible.length}/{users.length} người
          </span>
        )}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <section className="panel panel-flush">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [0, 1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td colSpan={5}>
                          <Skeleton height={20} />
                        </td>
                      </tr>
                    ))
                  : visible.map((u, i) => (
                      <tr key={u.id} style={{ "--i": Math.min(i, 20) }}>
                        <td>
                          <span className="cell-person">
                            <Avatar name={u.name} size={32} />
                            <b>{u.name}</b>
                            {u.id === me.id && <Chip tone="accent">Bạn</Chip>}
                          </span>
                        </td>
                        <td className="muted">{u.email}</td>
                        <td>
                          <Chip tone={u.role === "ADMIN" ? "accent" : "neutral"}>{ROLE_LABEL[u.role]}</Chip>
                        </td>
                        <td className="muted nums">{u.createdAt ? formatDay(u.createdAt.slice(0, 10)) : ""}</td>
                        <td className="cell-actions">
                          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(u)}>
                            <Pencil size={15} aria-hidden="true" /> Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!loading && visible.length === 0 && (
            <EmptyState icon={Users} title="Không có ai khớp bộ lọc">
              Thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả".
            </EmptyState>
          )}
        </section>
      )}

      <UserFormModal
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        open={editing !== null}
        user={editing === "new" ? null : editing}
        isSelf={editing && editing !== "new" && editing.id === me.id}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    </>
  );
}

function UserFormModal({ open, user, isSelf, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !user;
  const form = useForm({ name: user?.name ?? "", email: user?.email ?? "", password: "", role: user?.role ?? "MEMBER" });
  const { values: v, set, errors, formError, busy } = form;

  const validate = (val) => ({
    name: val.name.trim().length < 2 || val.name.trim().length > 50 ? "Họ tên dài từ 2 đến 50 ký tự." : null,
    email: isNew && !isEmail(val.email) ? "Email chưa đúng định dạng." : null,
    password:
      (isNew || val.password) && val.password.length < 8 ? "Mật khẩu tối thiểu 8 ký tự." : null,
  });

  const save = () =>
    form.submit(validate, async (val) => {
      if (isNew) {
        await api.post("/users", { name: val.name.trim(), email: val.email.trim(), password: val.password, role: val.role });
        toast.success(`Đã tạo tài khoản cho ${val.name.trim()}.`);
      } else {
        const body = {};
        if (val.name.trim() !== user.name) body.name = val.name.trim();
        if (!isSelf && val.role !== user.role) body.role = val.role;
        if (val.password) body.password = val.password;
        if (Object.keys(body).length === 0) return onClose();
        await api.patch(`/users/${user.id}`, body);
        toast.success(val.password ? "Đã lưu, mật khẩu mới có hiệu lực ngay." : "Đã lưu thay đổi.");
      }
      onSaved();
    });

  return (
    <Modal
      open={open}
      title={isNew ? "Tạo tài khoản" : `Sửa ${user.name}`}
      description={isNew ? "Gửi email và mật khẩu này cho người dùng để họ đăng nhập." : user.email}
      onClose={onClose}
      busy={busy}
      onSubmit={save}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={isNew ? "Tạo tài khoản" : "Lưu"} />}
    >
      <Field id="u-name" label="Họ tên" value={v.name} onChange={set("name")} error={errors.name} autoComplete="off" />
      {isNew && (
        <Field id="u-email" label="Email" type="email" value={v.email} onChange={set("email")} error={errors.email} autoComplete="off" placeholder="ten@sgroup.com" />
      )}
      <Field
        id="u-password"
        label={isNew ? "Mật khẩu" : "Mật khẩu mới"}
        type="text"
        value={v.password}
        onChange={set("password")}
        error={errors.password}
        autoComplete="new-password"
        hint={isNew ? "Tối thiểu 8 ký tự." : "Để trống nếu không đổi mật khẩu."}
      />
      <Field
        id="u-role"
        as="select"
        label="Vai trò"
        value={v.role}
        onChange={set("role")}
        disabled={isSelf}
        hint={isSelf ? "Không tự đổi vai trò của chính mình, tránh mất quyền Admin." : "Chọn Thành viên cho cả học viên lẫn mentor."}
      >
        <option value="MEMBER">Thành viên</option>
        <option value="ADMIN">Admin</option>
      </Field>
      <FormError message={formError} />
    </Modal>
  );
}
