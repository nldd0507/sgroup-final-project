import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  CalendarClock,
  CircleCheck,
  ExternalLink,
  Hourglass,
  Info,
  Inbox,
  Pencil,
  Send,
  Star,
  Trash2,
  UserX,
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { deadlineInfo, formatDateTime } from "../lib/format.js";
import { roleInClass } from "../lib/roles.js";
import { Avatar, Chip, EmptyState, ErrorState, PageHeader, Score, Skeleton, Spinner } from "../components/ui.jsx";
import Modal, { ConfirmModal, ModalActions } from "../components/Modal.jsx";
import AssignmentFormModal from "../components/AssignmentFormModal.jsx";
import { Field, FormError, isHttpUrl, useForm } from "../components/form.jsx";
import { useToast } from "../components/Toast.jsx";

async function loadAssignment(id, user) {
  const assignment = await api.get(`/assignments/${id}`);
  const cls = await api.get(`/classes/${assignment.classId}`);
  const role = roleInClass(user, cls);
  const [submissions, members] = await Promise.all([
    role === "admin" ? null : api.get(`/assignments/${id}/submissions`),
    role === "mentor" ? api.get(`/classes/${cls.id}/members`) : null,
  ]);
  return { assignment, cls, role, submissions, members };
}

export default function AssignmentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => loadAssignment(id, user), [id, user.id]);

  if (loading && !data) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <AssignmentView data={data} reload={reload} />;
}

function AssignmentView({ data, reload }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { assignment: a, cls, role, submissions, members } = data;
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const d = deadlineInfo(a.deadline);

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await api.del(`/assignments/${a.id}`);
      toast.success("Đã xóa bài tập.");
      navigate(`/classes/${cls.id}?tab=assignments`, { replace: true });
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
          { to: `/classes/${cls.id}?tab=assignments`, label: cls.name },
          { label: "Bài tập" },
        ]}
        title={a.title}
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
      </PageHeader>

      <div className="grid-2">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Đề bài</h2>
              <span className="row-actions" style={{ gap: 6 }}>
                <Chip tone={d.tone}>{d.label}</Chip>
                <Chip tone="accent">Thang điểm {a.maximumScore}</Chip>
              </span>
            </div>
            {a.description ? <p className="prose">{a.description}</p> : <p className="muted">Mentor chưa viết mô tả cho bài này.</p>}
            <dl className="kv">
              <dt>Hạn nộp</dt>
              <dd className="nums">{formatDateTime(a.deadline)}</dd>
              <dt>Lớp</dt>
              <dd>{cls.name}</dd>
              <dt>Mentor</dt>
              <dd>{cls.mentor?.name}</dd>
            </dl>
          </section>
          {role === "admin" && (
            <div className="notice">
              <Info size={18} aria-hidden="true" />
              <span>
                Admin xem được đề bài nhưng không xem bài nộp: chỉ học viên đó và mentor của lớp được xem (BR-25). Mentor{" "}
                <b>{cls.mentor?.name}</b> là người chấm bài.
              </span>
            </div>
          )}
        </div>

        <div className="stack">
          {role === "member" && <MemberSubmission assignment={a} submission={submissions[0]} onSubmitted={reload} />}
          {role === "mentor" && <MentorSubmissions assignment={a} submissions={submissions} members={members} onReviewed={reload} />}
        </div>
      </div>

      <AssignmentFormModal
        open={editing}
        assignmentId={a.id}
        classId={cls.id}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          reload();
        }}
      />
      <ConfirmModal
        open={deleting}
        title={`Xóa bài tập "${a.title}"?`}
        busy={deleteBusy}
        onClose={() => setDeleting(false)}
        onConfirm={remove}
        confirmLabel="Xóa bài tập"
      >
        {submissions?.length ? `${submissions.length} bài nộp và điểm của bài này sẽ bị xóa theo.` : "Thao tác này không hoàn tác được."}
      </ConfirmModal>
    </>
  );
}

/* ---------------- Học viên ---------------- */

function MemberSubmission({ assignment: a, submission, onSubmitted }) {
  const toast = useToast();
  const form = useForm({ content: "", repositoryUrl: "" });
  const { values: v, set, errors, formError, busy } = form;
  const closed = new Date(a.deadline).getTime() <= Date.now();

  if (submission) {
    return (
      <section className="panel">
        <div className="panel-head">
          <h2>Bài nộp của bạn</h2>
          {submission.score != null ? <Chip tone="ok">Đã chấm</Chip> : <Chip tone="info">Chờ chấm</Chip>}
        </div>
        {submission.score != null ? (
          <div className="result-card">
            <Score value={submission.score} max={a.maximumScore} big />
            <div>
              <p className="field-label">Nhận xét của mentor</p>
              <p className="prose" style={{ fontSize: "0.92rem" }}>
                {submission.feedback || "Mentor không để lại nhận xét."}
              </p>
              <p className="row-sub nums">Chấm lúc {formatDateTime(submission.reviewedAt)}</p>
            </div>
          </div>
        ) : (
          <div className="notice">
            <Hourglass size={18} aria-hidden="true" />
            <span>Mentor chưa chấm bài này. Điểm và nhận xét sẽ hiện ở đây.</span>
          </div>
        )}
        <SubmissionBody submission={submission} />
      </section>
    );
  }

  if (closed) {
    return (
      <section className="panel">
        <EmptyState icon={CalendarClock} title="Đã hết hạn nộp">
          Hạn nộp là {formatDateTime(a.deadline)}. Bạn chưa nộp bài này.
        </EmptyState>
      </section>
    );
  }

  const validate = (val) => {
    const content = val.content.trim();
    const url = val.repositoryUrl.trim();
    return {
      content: !content && !url ? "Nhập nội dung bài làm hoặc link repository." : content.length > 10000 ? "Nội dung tối đa 10.000 ký tự." : null,
      repositoryUrl: url && !isHttpUrl(url) ? "Link phải bắt đầu bằng http:// hoặc https://." : url.length > 500 ? "Link tối đa 500 ký tự." : null,
    };
  };

  const submit = () =>
    form.submit(validate, async (val) => {
      const body = {};
      if (val.content.trim()) body.content = val.content.trim();
      if (val.repositoryUrl.trim()) body.repositoryUrl = val.repositoryUrl.trim();
      await api.post(`/assignments/${a.id}/submissions`, body);
      toast.success("Đã nộp bài. Mentor sẽ chấm và nhận xét.");
      onSubmitted();
    });

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) submit();
      }}
      noValidate
    >
      <div className="panel-head">
        <h2>Nộp bài</h2>
        <Chip tone={deadlineInfo(a.deadline).tone}>{deadlineInfo(a.deadline).label}</Chip>
      </div>
      <Field
        id="s-url"
        label="Link repository"
        type="url"
        placeholder="https://github.com/ten-ban/bai-tap"
        value={v.repositoryUrl}
        onChange={set("repositoryUrl")}
        error={errors.repositoryUrl}
      />
      <Field
        id="s-content"
        as="textarea"
        label="Nội dung"
        rows={6}
        placeholder="Mô tả cách làm, ghi chú cho mentor…"
        value={v.content}
        onChange={set("content")}
        error={errors.content}
        hint="Cần ít nhất một trong hai: link hoặc nội dung."
      />
      <div className="notice warn">
        <Info size={18} aria-hidden="true" />
        <span>Mỗi người chỉ nộp một lần, nộp rồi không sửa được. Kiểm tra kỹ trước khi nộp.</span>
      </div>
      <FormError message={formError} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? <Spinner size={16} /> : <Send size={17} aria-hidden="true" />}
        {busy ? "Đang nộp…" : "Nộp bài"}
      </button>
    </form>
  );
}

function SubmissionBody({ submission: s }) {
  return (
    <div className="stack-sm">
      <dl className="kv">
        <dt>Nộp lúc</dt>
        <dd className="nums">{formatDateTime(s.submittedAt)}</dd>
        {s.repositoryUrl && (
          <>
            <dt>Repository</dt>
            <dd>
              <a href={s.repositoryUrl} target="_blank" rel="noopener noreferrer">
                {s.repositoryUrl} <ExternalLink size={13} aria-hidden="true" />
              </a>
            </dd>
          </>
        )}
      </dl>
      {s.content && <div className="prose-box">{s.content}</div>}
    </div>
  );
}

/* ---------------- Mentor ---------------- */

function MentorSubmissions({ assignment: a, submissions, members, onReviewed }) {
  const [params, setParams] = useSearchParams();
  const [reviewing, setReviewing] = useState(null);
  const nameOf = useMemo(() => Object.fromEntries(members.map((m) => [m.memberId, m.name])), [members]);
  const submittedIds = new Set(submissions.map((s) => s.memberId));
  const missing = members.filter((m) => !submittedIds.has(m.memberId));
  const graded = submissions.filter((s) => s.score != null);
  const avg = graded.length ? (graded.reduce((sum, s) => sum + s.score, 0) / graded.length).toFixed(1) : "–";
  const sorted = [...submissions].sort(
    (x, y) => (x.score == null ? 0 : 1) - (y.score == null ? 0 : 1) || new Date(x.submittedAt) - new Date(y.submittedAt)
  );

  // Mở thẳng hộp chấm khi đi từ trang tổng quan: /assignments/:id?review=<submissionId>
  useEffect(() => {
    const target = Number(params.get("review"));
    if (target) {
      const s = submissions.find((x) => x.id === target);
      if (s) setReviewing(s);
      setParams({}, { replace: true });
    }
  }, [params, setParams, submissions]);

  return (
    <>
      <div className="stats stats-3 stagger">
        <MiniStat icon={Inbox} tone="tone-blue" label="Đã nộp" value={`${submissions.length}/${members.length}`} i={0} />
        <MiniStat icon={CircleCheck} tone="tone-green" label="Đã chấm" value={graded.length} i={1} />
        <MiniStat icon={Star} tone="tone-amber" label="Điểm TB" value={avg} i={2} />
      </div>

      <section className="panel panel-flush">
        <div className="panel-head">
          <h2>Bài nộp</h2>
          <span className="muted small">chưa chấm xếp trước</span>
        </div>
        {submissions.length === 0 ? (
          <EmptyState icon={Inbox} title="Chưa có ai nộp">
            Bài nộp của học viên sẽ hiện ở đây để bạn chấm.
          </EmptyState>
        ) : (
          <ul className="rows">
            {sorted.map((s, i) => (
              <li key={s.id} className="lesson-row" style={{ "--i": Math.min(i, 15) }}>
                <Avatar name={nameOf[s.memberId]} size={32} />
                <div className="row-main">
                  <span className="row-title">{nameOf[s.memberId] ?? `Học viên #${s.memberId}`}</span>
                  <span className="row-sub nums">Nộp {formatDateTime(s.submittedAt)}</span>
                </div>
                {s.score != null ? <Score value={s.score} max={a.maximumScore} /> : <Chip tone="warn">Chờ chấm</Chip>}
                <button type="button" className={`btn btn-sm ${s.score != null ? "btn-ghost" : "btn-primary"}`} onClick={() => setReviewing(s)}>
                  {s.score != null ? "Chấm lại" : "Chấm"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {missing.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Chưa nộp</h2>
            <span className="muted small">{missing.length} học viên</span>
          </div>
          <ul className="rows">
            {missing.map((m) => (
              <li key={m.memberId} className="row">
                <Avatar name={m.name} size={28} />
                <div className="row-main">
                  <span className="row-title">{m.name}</span>
                  <span className="row-sub">{m.email}</span>
                </div>
                <UserX size={16} className="muted" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {reviewing && (
        <ReviewModal
          submission={reviewing}
          memberName={nameOf[reviewing.memberId]}
          assignment={a}
          onClose={() => setReviewing(null)}
          onSaved={() => {
            setReviewing(null);
            onReviewed();
          }}
        />
      )}
    </>
  );
}

function ReviewModal({ submission: s, memberName, assignment: a, onClose, onSaved }) {
  const toast = useToast();
  const form = useForm({ score: s.score != null ? String(s.score) : "", feedback: s.feedback ?? "" });
  const { values: v, set, errors, formError, busy } = form;
  const quick = a.maximumScore <= 10 ? Array.from({ length: a.maximumScore + 1 }, (_, i) => i) : null;

  const validate = (val) => ({
    score:
      !/^\d+$/.test(val.score) || Number(val.score) > a.maximumScore ? `Điểm là số nguyên từ 0 đến ${a.maximumScore}.` : null,
    feedback: val.feedback.length > 5000 ? "Nhận xét tối đa 5000 ký tự." : null,
  });

  const save = () =>
    form.submit(validate, async (val) => {
      const body = { score: Number(val.score) };
      if (val.feedback.trim()) body.feedback = val.feedback.trim();
      await api.patch(`/submissions/${s.id}/review`, body);
      toast.success(`Đã chấm ${memberName ?? "bài nộp"}: ${body.score}/${a.maximumScore}.`);
      onSaved();
    });

  return (
    <Modal
      open
      title={`Chấm bài của ${memberName ?? `học viên #${s.memberId}`}`}
      description={a.title}
      onClose={onClose}
      busy={busy}
      width={620}
      onSubmit={save}
      footer={<ModalActions onCancel={onClose} busy={busy} submitLabel={s.score != null ? "Lưu điểm mới" : "Lưu điểm"} />}
    >
      <SubmissionBody submission={s} />
      <div className="field">
        <label htmlFor="r-score">Điểm (0 – {a.maximumScore})</label>
        {quick && (
          <div className="demo-list" role="group" aria-label="Chọn nhanh điểm">
            {quick.map((n) => (
              <button
                key={n}
                type="button"
                className="chip-btn"
                aria-pressed={v.score === String(n)}
                style={v.score === String(n) ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent-text)" } : undefined}
                onClick={() => set("score")(String(n))}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <input
          id="r-score"
          className="input"
          type="number"
          min={0}
          max={a.maximumScore}
          inputMode="numeric"
          value={v.score}
          onChange={set("score")}
          aria-invalid={errors.score ? "true" : undefined}
          style={{ maxWidth: 160 }}
        />
        {errors.score && <span className="field-error">{errors.score}</span>}
      </div>
      <Field
        id="r-feedback"
        as="textarea"
        label="Nhận xét"
        rows={4}
        placeholder="Điểm tốt, chỗ cần sửa…"
        value={v.feedback}
        onChange={set("feedback")}
        error={errors.feedback}
      />
      <FormError message={formError} />
    </Modal>
  );
}

function MiniStat({ icon: Icon, tone, label, value, i }) {
  return (
    <div className={`stat ${tone}`} style={{ "--i": i }}>
      <span className="stat-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Đang tải">
      <Skeleton width={220} height={12} />
      <Skeleton width="40%" height={30} />
      <div className="grid-2">
        <section className="panel">
          <Skeleton width="30%" height={18} />
          <Skeleton height={80} />
        </section>
        <section className="panel">
          <Skeleton width="30%" height={18} />
          <Skeleton height={120} />
        </section>
      </div>
    </div>
  );
}
