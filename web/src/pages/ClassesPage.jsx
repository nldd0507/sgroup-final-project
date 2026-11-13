import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CalendarDays, Plus, School, Search } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { classStatus, formatDay } from "../lib/format.js";
import { ROLE_IN_CLASS_LABEL, roleInClass } from "../lib/roles.js";
import { Avatar, Chip, EmptyState, ErrorState, PageHeader, Skeleton, hueOf } from "../components/ui.jsx";
import ClassFormModal from "../components/ClassFormModal.jsx";

export const STATUS_TONE = { ongoing: "ok", upcoming: "info", ended: "neutral" };
const STATUS_ORDER = { ongoing: 0, upcoming: 1, ended: 2 };
const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "ongoing", label: "Đang học" },
  { key: "upcoming", label: "Sắp mở" },
  { key: "ended", label: "Đã kết thúc" },
];

export default function ClassesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === "ADMIN";
  const { data, error, loading, reload } = useAsync(async () => {
    const [classes, users] = await Promise.all([api.get("/classes"), isAdmin ? api.get("/users") : null]);
    return { classes, users };
  }, [isAdmin]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);

  const nameOf = useMemo(() => Object.fromEntries((data?.users ?? []).map((u) => [u.id, u.name])), [data]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.classes ?? [])
      .map((c) => ({ ...c, status: classStatus(c) }))
      .filter((c) => (status === "all" || c.status.key === status) && (!q || c.name.toLowerCase().includes(q)))
      .sort((a, b) => STATUS_ORDER[a.status.key] - STATUS_ORDER[b.status.key] || a.startDate.localeCompare(b.startDate));
  }, [data, query, status]);

  return (
    <>
      <PageHeader
        title="Lớp học"
        lead={isAdmin ? "Tất cả lớp trong hệ thống." : "Các lớp bạn đang dạy hoặc đang học."}
      >
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={17} aria-hidden="true" /> Tạo lớp
          </button>
        )}
      </PageHeader>

      <div className="toolbar">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên lớp"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm lớp"
          />
        </label>
        <div className="segmented" role="group" aria-label="Lọc theo trạng thái">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={status === f.key} onClick={() => setStatus(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="tile-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="tile">
              <Skeleton width="60%" height={18} />
              <Skeleton height={36} />
              <Skeleton width="40%" height={14} />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={School}
            title={data.classes.length === 0 ? "Chưa có lớp nào" : "Không có lớp khớp bộ lọc"}
            action={
              isAdmin &&
              data.classes.length === 0 && (
                <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                  <Plus size={16} aria-hidden="true" /> Tạo lớp đầu tiên
                </button>
              )
            }
          >
            {data.classes.length === 0 && !isAdmin
              ? "Khi Admin thêm bạn vào lớp hoặc chỉ định bạn làm mentor, lớp sẽ hiện ở đây."
              : null}
          </EmptyState>
        </section>
      ) : (
        <div className="tile-grid stagger">
          {visible.map((c, i) => {
            const myRole = roleInClass(user, c);
            return (
              <Link key={c.id} to={`/classes/${c.id}`} className="tile" style={{ "--i": Math.min(i, 12), "--hue": hueOf(c.name) }}>
                <div className="class-card-top">
                  <h3>{c.name}</h3>
                  <Chip tone={STATUS_TONE[c.status.key]}>{c.status.label}</Chip>
                </div>
                <p className="tile-desc">{c.description || "Chưa có mô tả."}</p>
                <div className="tile-meta">
                  <span className="row-person">
                    <CalendarDays size={15} aria-hidden="true" />
                    {formatDay(c.startDate)} – {formatDay(c.endDate)}
                  </span>
                  {isAdmin ? (
                    <span className="row-person">
                      <Avatar name={nameOf[c.mentorId]} size={22} />
                      <span>{nameOf[c.mentorId]}</span>
                    </span>
                  ) : (
                    <Chip tone={myRole === "mentor" ? "accent" : "neutral"}>Bạn là {ROLE_IN_CLASS_LABEL[myRole].toLowerCase()}</Chip>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ClassFormModal
        key={creating ? "open" : "closed"}
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(c) => {
          setCreating(false);
          navigate(`/classes/${c.id}?tab=members`);
        }}
      />
    </>
  );
}
