import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Check, Pencil, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { roleInClass } from "../lib/roles.js";
import { Chip, ErrorState, PageHeader, ProgressBar, Skeleton, Spinner } from "../components/ui.jsx";
import { ConfirmModal } from "../components/Modal.jsx";
import LessonFormModal from "../components/LessonFormModal.jsx";
import { useToast } from "../components/Toast.jsx";

async function loadLesson(id, user) {
  const lesson = await api.get(`/lessons/${id}`);
  const [cls, lessons] = await Promise.all([
    api.get(`/classes/${lesson.classId}`),
    api.get(`/classes/${lesson.classId}/lessons`),
  ]);
  return { lesson, cls, lessons, role: roleInClass(user, cls) };
}

export default function LessonPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => loadLesson(id, user), [id, user.id]);

  if (loading && !data) {
    return (
      <div className="stack" aria-busy="true" aria-label="Đang tải">
        <Skeleton width={220} height={12} />
        <Skeleton width="45%" height={30} />
        <section className="panel">
          <Skeleton height={14} />
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="75%" />
        </section>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <LessonView key={id} data={data} reload={reload} />;
}

function LessonView({ data, reload }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { lesson, cls, role } = data;
  const [lessons, setLessons] = useState(data.lessons);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const index = lessons.findIndex((l) => l.id === lesson.id);
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const done = lessons[index]?.completed;
  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  const complete = async () => {
    setBusy(true);
    try {
      await api.post(`/lessons/${lesson.id}/complete`);
      setLessons((list) => list.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l)));
      toast.success(next ? "Đã hoàn thành. Sang bài tiếp theo nhé." : "Đã hoàn thành bài cuối của lớp!");
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.del(`/lessons/${lesson.id}`);
      toast.success("Đã xóa bài học.");
      navigate(`/classes/${cls.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        crumbs={[
          { to: "/classes", label: "Lớp học" },
          { to: `/classes/${cls.id}`, label: cls.name },
          { label: `Bài ${lesson.order}` },
        ]}
        eyebrow={`Bài ${lesson.order} / ${lessons.length}`}
        title={lesson.title}
      >
        {role === "mentor" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
              <Pencil size={16} aria-hidden="true" /> Sửa
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(true)}>
              <Trash2 size={16} aria-hidden="true" /> Xóa
            </button>
          </>
        )}
        {role === "member" &&
          (done ? (
            <Chip tone="ok">
              <Check size={14} /> Đã học
            </Chip>
          ) : (
            <button type="button" className="btn btn-primary" onClick={complete} disabled={busy}>
              {busy ? <Spinner size={15} /> : <Check size={17} aria-hidden="true" />} Đánh dấu đã học
            </button>
          ))}
      </PageHeader>

      <div className="stack">
        {role === "member" && (
          <section className="panel">
            <div className="panel-head">
              <span className="field-label">Tiến độ lớp {cls.name}</span>
              <span className="muted small nums">
                {completedCount}/{lessons.length} bài · <b>{progress}%</b>
              </span>
            </div>
            <ProgressBar value={progress} label="Tiến độ học" />
          </section>
        )}

        <article className="panel" style={{ padding: "24px clamp(18px, 3vw, 32px)" }}>
          {lesson.content ? <div className="prose">{lesson.content}</div> : <p className="muted">Bài này chưa có nội dung.</p>}
        </article>

        <nav className="pager" aria-label="Chuyển bài">
          {prev && (
            <Link to={`/lessons/${prev.id}`}>
              <small>
                <ArrowLeft size={12} aria-hidden="true" /> Bài trước
              </small>
              <span className="row-title">{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link to={`/lessons/${next.id}`} className="next">
              <small>
                Bài tiếp <ArrowRight size={12} aria-hidden="true" />
              </small>
              <span className="row-title">{next.title}</span>
            </Link>
          )}
        </nav>
      </div>

      <LessonFormModal
        open={editing}
        lessonId={lesson.id}
        classId={cls.id}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          reload();
        }}
      />
      <ConfirmModal
        open={deleting}
        title={`Xóa bài "${lesson.title}"?`}
        busy={deleteBusy}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        confirmLabel="Xóa bài học"
      >
        Tiến độ của học viên với bài này cũng bị xóa theo.
      </ConfirmModal>
    </>
  );
}
