import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  BookOpen,
  Check,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { classStatus, deadlineInfo, formatDateTime, formatDay } from "../lib/format.js";
import { ROLE_IN_CLASS_LABEL, roleInClass } from "../lib/roles.js";
import {
  Avatar,
  Chip,
  Crumbs,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
  Spinner,
  Tabs,
} from "../components/ui.jsx";
import Modal, { ConfirmModal } from "../components/Modal.jsx";
import ClassFormModal from "../components/ClassFormModal.jsx";
import LessonFormModal from "../components/LessonFormModal.jsx";
import AssignmentFormModal from "../components/AssignmentFormModal.jsx";
import { useToast } from "../components/Toast.jsx";
import { STATUS_TONE } from "./ClassesPage.jsx";

async function loadClass(id, user) {
  const cls = await api.get(`/classes/${id}`);
  const role = roleInClass(user, cls);
  const [lessons, assignments, members] = await Promise.all([
    api.get(`/classes/${id}/lessons`),
    api.get(`/classes/${id}/assignments`),
    // Danh sách học viên chỉ Admin và mentor của lớp xem được
    role === "member" ? null : api.get(`/classes/${id}/members`),
  ]);
  return { cls, role, lessons, assignments, members };
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => loadClass(id, user), [id, user.id]);

  if (loading && !data) return <ClassSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <ClassView key={id} initial={data} reload={reload} />;
}

function ClassView({ initial, reload }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [lessons, setLessons] = useState(initial.lessons);
  const [assignments, setAssignments] = useState(initial.assignments);
  const [members, setMembers] = useState(initial.members);
  const [editingClass, setEditingClass] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { cls, role } = initial;
  const status = classStatus(cls);
  const canManageMembers = role === "admin";

  const tabs = [
    { key: "lessons", label: "Bài học", icon: BookOpen, count: lessons.length },
    { key: "assignments", label: "Bài tập", icon: ClipboardList, count: assignments.length },
    ...(members ? [{ key: "members", label: "Học viên", icon: Users, count: members.length }] : []),
  ];
  const tab = tabs.some((t) => t.key === params.get("tab")) ? params.get("tab") : "lessons";
  const setTab = (key) => setParams(key === "lessons" ? {} : { tab: key }, { replace: true });

  // Tiến độ của học viên tính từ danh sách bài học (cùng công thức với GET /classes/:id/progress)
  const completed = lessons.filter((l) => l.completed).length;
  const progress = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

  const removeClass = async () => {
    setDeleteBusy(true);
    try {
      await api.del(`/classes/${cls.id}`);
      toast.success(`Đã xóa lớp ${cls.name}.`);
      navigate("/classes", { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <section className="hero-card">
        <Crumbs items={[{ to: "/classes", label: "Lớp học" }, { label: cls.name }]} />
        <div className="hero-top">
          <div>
            <h1>
              {cls.name}
              <Chip tone={STATUS_TONE[status.key]}>{status.label}</Chip>
            </h1>
            <p className="lead">{cls.description || "Chưa có mô tả."}</p>
          </div>
          {role === "admin" && (
            <div className="page-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditingClass(true)}>
                <Pencil size={16} aria-hidden="true" /> Sửa lớp
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleting(true)}>
                <Trash2 size={16} aria-hidden="true" /> Xóa
              </button>
            </div>
          )}
        </div>
        <dl className="meta-list">
          <div>
            <dt>Mentor</dt>
            <dd>
              <Avatar name={cls.mentor?.name} size={24} />
              {cls.mentor?.name}
            </dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd className="nums">
              {formatDay(cls.startDate)} – {formatDay(cls.endDate)}
            </dd>
          </div>
          {members && (
            <div>
              <dt>Học viên</dt>
              <dd className="nums">{members.length}</dd>
            </div>
          )}
          <div>
            <dt>Vai trò của bạn</dt>
            <dd>
              <Chip tone={role === "member" ? "neutral" : "accent"}>{ROLE_IN_CLASS_LABEL[role]}</Chip>
            </dd>
          </div>
        </dl>
        {role === "member" && (
          <div className="hero-progress">
            <div className="panel-head">
              <span className="field-label">Tiến độ của bạn</span>
              <span className="muted small nums">
                {completed}/{lessons.length} bài · <b>{progress}%</b>
              </span>
            </div>
            <ProgressBar value={progress} label="Tiến độ học" />
          </div>
        )}
      </section>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      <div key={tab} className="page">
        {tab === "lessons" && <LessonsTab cls={cls} role={role} lessons={lessons} setLessons={setLessons} />}
        {tab === "assignments" && (
          <AssignmentsTab cls={cls} role={role} assignments={assignments} setAssignments={setAssignments} members={members} />
        )}
        {tab === "members" && (
          <MembersTab cls={cls} canManage={canManageMembers} members={members} setMembers={setMembers} />
        )}
      </div>

      <ClassFormModal
        key={editingClass ? "edit" : "closed"}
        open={editingClass}
        cls={cls}
        onClose={() => setEditingClass(false)}
        onSaved={() => {
          setEditingClass(false);
          reload();
        }}
      />
      <ConfirmModal
        open={deleting}
        title={`Xóa lớp ${cls.name}?`}
        busy={deleteBusy}
        onClose={() => setDeleting(false)}
        onConfirm={removeClass}
        confirmLabel="Xóa lớp"
      >
        Toàn bộ học viên, {lessons.length} bài học, {assignments.length} bài tập và mọi bài nộp của lớp sẽ bị xóa vĩnh viễn.
      </ConfirmModal>
    </>
  );
}

/* ---------------- Bài học ---------------- */

function LessonsTab({ cls, role, lessons, setLessons }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | "new" | lessonId
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const isMentor = role === "mentor";
  const nextOrder = lessons.reduce((max, l) => Math.max(max, l.order), 0) + 1;

  const complete = async (lesson) => {
    setBusyId(lesson.id);
    try {
      await api.post(`/lessons/${lesson.id}/complete`);
      setLessons((list) => list.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l)));
      toast.success(`Đã hoàn thành "${lesson.title}".`);
    } catch (err) {
      toast.error(err.message);
    }
    setBusyId(null);
  };

  const saved = (lesson) => {
    setLessons((list) => {
      const exists = list.some((l) => l.id === lesson.id);
      const item = { id: lesson.id, classId: lesson.classId, title: lesson.title, order: lesson.order };
      const next = exists ? list.map((l) => (l.id === lesson.id ? { ...l, ...item } : l)) : [...list, item];
      return next.sort((a, b) => a.order - b.order);
    });
    setEditing(null);
  };

  const [deleteBusy, setDeleteBusy] = useState(false);
  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.del(`/lessons/${deleting.id}`);
      setLessons((list) => list.filter((l) => l.id !== deleting.id));
      toast.success("Đã xóa bài học.");
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteBusy(false);
  };

  return (
    <section className="panel panel-flush">
      <div className="panel-head">
        <h2>Bài học theo thứ tự</h2>
        {isMentor && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
            <Plus size={16} aria-hidden="true" /> Thêm bài học
          </button>
        )}
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Lớp chưa có bài học"
          action={
            isMentor && (
              <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
                <Plus size={16} aria-hidden="true" /> Thêm bài đầu tiên
              </button>
            )
          }
        >
          {isMentor ? "Bài học bạn thêm sẽ hiện ngay cho học viên trong lớp." : "Mentor của lớp sẽ thêm bài học ở đây."}
        </EmptyState>
      ) : (
        <div>
          {lessons.map((l, i) => (
            <div key={l.id} className={`lesson-row${l.completed ? " done" : ""}`} style={{ "--i": Math.min(i, 15) }}>
              <span className="order-badge">{l.completed ? <Check size={16} /> : l.order}</span>
              <Link to={`/lessons/${l.id}`} className="lesson-link">
                <span className="row-title">{l.title}</span>
                <span className="row-sub">Bài {l.order}</span>
              </Link>
              {role === "member" && (
                <button
                  type="button"
                  className={`check-btn${l.completed ? " done" : ""}`}
                  disabled={l.completed || busyId === l.id}
                  onClick={() => complete(l)}
                >
                  <span className="dot">{l.completed && <Check size={12} strokeWidth={3} />}</span>
                  {busyId === l.id ? "Đang lưu…" : l.completed ? "Đã học" : "Đánh dấu đã học"}
                </button>
              )}
              {isMentor && (
                <span className="row-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(l.id)} aria-label={`Sửa ${l.title}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => setDeleting(l)} aria-label={`Xóa ${l.title}`}>
                    <Trash2 size={16} />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <LessonFormModal
        open={editing !== null}
        lessonId={editing === "new" ? null : editing}
        classId={cls.id}
        nextOrder={nextOrder}
        onClose={() => setEditing(null)}
        onSaved={saved}
      />
      <ConfirmModal
        open={!!deleting}
        title={`Xóa bài "${deleting?.title}"?`}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        confirmLabel="Xóa bài học"
      >
        Tiến độ của học viên với bài này cũng bị xóa theo.
      </ConfirmModal>
    </section>
  );
}

/* ---------------- Bài tập ---------------- */

function AssignmentsTab({ cls, role, assignments, setAssignments, members }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | "new" | assignmentId
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const isMentor = role === "mentor";

  // Mentor: bài nộp của cả lớp; học viên: chỉ bài của mình; Admin không xem được (BR-25)
  const ids = assignments.map((a) => a.id).join(",");
  const subs = useAsync(async () => {
    if (role === "admin") return {};
    const lists = await Promise.all(
      assignments.map((a) => api.get(`/assignments/${a.id}/submissions`).catch(() => []))
    );
    return Object.fromEntries(assignments.map((a, i) => [a.id, lists[i]]));
  }, [ids, role]);

  const saved = (a) => {
    setAssignments((list) => {
      const item = { id: a.id, classId: a.classId, title: a.title, deadline: a.deadline, maximumScore: a.maximumScore };
      const exists = list.some((x) => x.id === a.id);
      const next = exists ? list.map((x) => (x.id === a.id ? item : x)) : [...list, item];
      return next.sort((x, y) => new Date(x.deadline) - new Date(y.deadline));
    });
    setEditing(null);
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.del(`/assignments/${deleting.id}`);
      setAssignments((list) => list.filter((a) => a.id !== deleting.id));
      toast.success("Đã xóa bài tập.");
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteBusy(false);
  };

  const statusFor = (a) => {
    const list = subs.data?.[a.id];
    const d = deadlineInfo(a.deadline);
    if (role === "member") {
      if (!list) return <Skeleton width={80} height={22} radius={99} />;
      const mine = list[0];
      if (mine?.score != null) return <Chip tone="ok">Điểm {mine.score}/{a.maximumScore}</Chip>;
      if (mine) return <Chip tone="info">Đã nộp, chờ chấm</Chip>;
      return <Chip tone={d.tone === "neutral" ? "warn" : d.tone}>{d.label === "Đã quá hạn" ? "Quá hạn, chưa nộp" : `Chưa nộp · ${d.label.toLowerCase()}`}</Chip>;
    }
    if (role === "mentor") {
      if (!list) return <Skeleton width={120} height={22} radius={99} />;
      const pending = list.filter((s) => s.score == null).length;
      return (
        <span className="row-actions" style={{ gap: 6 }}>
          <Chip tone="neutral">
            {list.length}/{members?.length ?? "?"} đã nộp
          </Chip>
          {pending > 0 && <Chip tone="warn">{pending} chờ chấm</Chip>}
        </span>
      );
    }
    return <Chip tone={d.tone}>{d.label}</Chip>;
  };

  return (
    <section className="panel panel-flush">
      <div className="panel-head">
        <h2>Bài tập theo hạn nộp</h2>
        {isMentor && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
            <Plus size={16} aria-hidden="true" /> Giao bài tập
          </button>
        )}
      </div>
      {role === "admin" && assignments.length > 0 && (
        <div style={{ padding: "12px 20px 0" }}>
          <p className="muted small">Admin xem được đề bài. Bài nộp chỉ học viên đó và mentor của lớp xem được (BR-25).</p>
        </div>
      )}

      {assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có bài tập"
          action={
            isMentor && (
              <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
                <Plus size={16} aria-hidden="true" /> Giao bài tập đầu tiên
              </button>
            )
          }
        >
          {isMentor ? "Đặt hạn nộp và thang điểm, học viên sẽ thấy ngay." : "Mentor của lớp sẽ giao bài tập ở đây."}
        </EmptyState>
      ) : (
        <div>
          {assignments.map((a, i) => (
            <div key={a.id} className="lesson-row" style={{ "--i": Math.min(i, 15) }}>
              <span className="order-badge">
                <ClipboardList size={16} />
              </span>
              <Link to={`/assignments/${a.id}`} className="lesson-link">
                <span className="row-title">{a.title}</span>
                <span className="row-sub nums">
                  Hạn {formatDateTime(a.deadline)} · thang điểm {a.maximumScore}
                </span>
              </Link>
              {statusFor(a)}
              {isMentor && (
                <span className="row-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(a.id)} aria-label={`Sửa ${a.title}`}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => setDeleting(a)} aria-label={`Xóa ${a.title}`}>
                    <Trash2 size={16} />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <AssignmentFormModal
        open={editing !== null}
        assignmentId={editing === "new" ? null : editing}
        classId={cls.id}
        onClose={() => setEditing(null)}
        onSaved={saved}
      />
      <ConfirmModal
        open={!!deleting}
        title={`Xóa bài tập "${deleting?.title}"?`}
        busy={deleteBusy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        confirmLabel="Xóa bài tập"
      >
        Mọi bài nộp và điểm của bài tập này sẽ bị xóa theo.
      </ConfirmModal>
    </section>
  );
}

/* ---------------- Học viên ---------------- */

function MembersTab({ cls, canManage, members, setMembers }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const reloadMembers = async () => setMembers(await api.get(`/classes/${cls.id}/members`));

  const remove = async () => {
    setRemoveBusy(true);
    try {
      await api.del(`/classes/${cls.id}/members/${removing.memberId}`);
      setMembers((list) => list.filter((m) => m.memberId !== removing.memberId));
      toast.success(`Đã xóa ${removing.name} khỏi lớp.`);
      setRemoving(null);
    } catch (err) {
      toast.error(err.message);
    }
    setRemoveBusy(false);
  };

  return (
    <section className="panel panel-flush">
      <div className="panel-head">
        <h2>Học viên của lớp</h2>
        {canManage && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <UserPlus size={16} aria-hidden="true" /> Thêm học viên
          </button>
        )}
      </div>
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Lớp chưa có học viên"
          action={
            canManage && (
              <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
                <UserPlus size={16} aria-hidden="true" /> Thêm học viên
              </button>
            )
          }
        >
          {canManage ? "Chọn thành viên để thêm vào lớp." : "Admin sẽ thêm học viên vào lớp."}
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Email</th>
                <th>Tham gia</th>
                {canManage && <th aria-label="Thao tác" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.memberId} style={{ "--i": Math.min(i, 20) }}>
                  <td>
                    <span className="cell-person">
                      <Avatar name={m.name} size={30} />
                      <b>{m.name}</b>
                    </span>
                  </td>
                  <td className="muted">{m.email}</td>
                  <td className="muted nums">{formatDateTime(m.joinedAt)}</td>
                  {canManage && (
                    <td className="cell-actions">
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRemoving(m)}>
                        <UserMinus size={15} aria-hidden="true" /> Xóa khỏi lớp
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <AddMembersModal
          cls={cls}
          members={members}
          onClose={async () => {
            setAdding(false);
            await reloadMembers().catch(() => {});
          }}
        />
      )}
      <ConfirmModal
        open={!!removing}
        title={`Xóa ${removing?.name} khỏi lớp?`}
        busy={removeBusy}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        confirmLabel="Xóa khỏi lớp"
      >
        Người này sẽ không xem được bài học, bài tập của lớp nữa.
      </ConfirmModal>
    </section>
  );
}

function AddMembersModal({ cls, members, onClose }) {
  const toast = useToast();
  const { data: users, error, loading } = useAsync(() => api.get("/users"), []);
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);

  const inClass = useMemo(() => new Set(members.map((m) => m.memberId)), [members]);
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter(
      (u) =>
        u.role === "MEMBER" &&
        u.id !== cls.mentorId &&
        !inClass.has(u.id) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, inClass, cls.mentorId]);

  const add = async (u) => {
    setBusyId(u.id);
    try {
      await api.post(`/classes/${cls.id}/members`, { memberId: u.id });
      setAdded((s) => new Set(s).add(u.id));
      toast.success(`Đã thêm ${u.name} vào lớp.`);
    } catch (err) {
      toast.error(err.message);
    }
    setBusyId(null);
  };

  return (
    <Modal
      open
      title="Thêm học viên"
      description={`Chọn thành viên để thêm vào ${cls.name}. Mentor của lớp không có trong danh sách.`}
      onClose={onClose}
      width={560}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Xong{added.size > 0 ? ` (đã thêm ${added.size})` : ""}
        </button>
      }
    >
      <label className="search" style={{ maxWidth: "none" }}>
        <Search size={16} aria-hidden="true" />
        <input
          className="input"
          type="search"
          placeholder="Tìm theo tên hoặc email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Tìm thành viên"
        />
      </label>
      {error ? (
        <ErrorState error={error} />
      ) : loading ? (
        <div className="full-loader" style={{ minHeight: 160 }}>
          <Spinner size={22} />
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState icon={Users} title="Không còn ai để thêm">
          Mọi thành viên đã ở trong lớp, hoặc không ai khớp từ khóa.
        </EmptyState>
      ) : (
        <ul className="pick-list">
          {candidates.map((u) => (
            <li key={u.id}>
              <Avatar name={u.name} size={30} />
              <div className="row-main">
                <span className="row-title">{u.name}</span>
                <span className="row-sub">{u.email}</span>
              </div>
              {added.has(u.id) ? (
                <Chip tone="ok">
                  <Check size={13} /> Đã thêm
                </Chip>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === u.id} onClick={() => add(u)}>
                  {busyId === u.id ? <Spinner size={13} /> : <Plus size={15} aria-hidden="true" />} Thêm
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function ClassSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Đang tải">
      <section className="hero-card">
        <Skeleton width={160} height={12} />
        <Skeleton width="45%" height={28} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={36} />
      </section>
      <section className="panel">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="row">
            <Skeleton width={32} height={32} radius={9} />
            <div className="row-main" style={{ gap: 6 }}>
              <Skeleton width="50%" height={13} />
              <Skeleton width="25%" height={11} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
