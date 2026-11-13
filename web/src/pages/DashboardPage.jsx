import { CalendarClock, ClipboardCheck, GraduationCap, Inbox, Presentation, School, Users } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useAsync } from "../lib/useAsync.js";
import { classStatus, deadlineInfo, formatDateTime, formatDay, formatToday, greeting } from "../lib/format.js";
import { Avatar, Chip, EmptyState, ErrorState, PageHeader, ProgressBar, ROLE_LABEL, Skeleton } from "../components/ui.jsx";

const STATUS_TONE = { ongoing: "ok", upcoming: "info", ended: "neutral" };
const STATUS_ORDER = { ongoing: 0, upcoming: 1, ended: 2 };

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow={formatToday()} title={`${greeting()}, ${user.name}`} />
      {user.role === "ADMIN" ? <AdminDashboard /> : <PersonDashboard user={user} />}
    </>
  );
}

/* ---------------- Admin ---------------- */

function AdminDashboard() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [users, classes] = await Promise.all([api.get("/users"), api.get("/classes")]);
    return { users, classes };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { users, classes } = data;
  const nameOf = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const withStatus = classes
    .map((c) => ({ ...c, status: classStatus(c) }))
    .sort((a, b) => STATUS_ORDER[a.status.key] - STATUS_ORDER[b.status.key] || a.startDate.localeCompare(b.startDate));
  const count = (key) => withStatus.filter((c) => c.status.key === key).length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const mentors = new Set(classes.map((c) => c.mentorId)).size;
  const newest = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="stack">
      <div className="stats stagger">
        <Stat icon={Users} label="Người dùng" value={users.length} note={`${admins} admin · ${users.length - admins} thành viên`} i={0} />
        <Stat icon={School} label="Lớp học" value={classes.length} note={`${count("ongoing")} lớp đang học`} i={1} />
        <Stat icon={Presentation} label="Mentor" value={mentors} note="đang phụ trách ít nhất 1 lớp" i={2} />
        <Stat icon={CalendarClock} label="Sắp mở" value={count("upcoming")} note="lớp chưa tới ngày bắt đầu" i={3} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Lớp học</h2>
            <span className="muted small">{classes.length} lớp</span>
          </div>
          {withStatus.length === 0 ? (
            <EmptyState icon={School} title="Chưa có lớp nào">
              Lớp mới tạo sẽ hiện ở đây, kèm mentor và thời gian học.
            </EmptyState>
          ) : (
            <ul className="rows stagger">
              {withStatus.map((c, i) => (
                <li key={c.id} className="row" style={{ "--i": i }}>
                  <div className="row-main">
                    <span className="row-title">{c.name}</span>
                    <span className="row-sub">
                      {formatDay(c.startDate)} – {formatDay(c.endDate)}
                    </span>
                  </div>
                  <span className="row-person">
                    <Avatar name={nameOf[c.mentorId]} size={26} />
                    <span>{nameOf[c.mentorId] ?? `#${c.mentorId}`}</span>
                  </span>
                  <Chip tone={STATUS_TONE[c.status.key]}>{c.status.label}</Chip>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Tài khoản mới</h2>
            <span className="muted small">5 gần nhất</span>
          </div>
          <ul className="rows stagger">
            {newest.map((u, i) => (
              <li key={u.id} className="row" style={{ "--i": i }}>
                <Avatar name={u.name} size={32} />
                <div className="row-main">
                  <span className="row-title">{u.name}</span>
                  <span className="row-sub">{u.email}</span>
                </div>
                <Chip tone={u.role === "ADMIN" ? "accent" : "neutral"}>{ROLE_LABEL[u.role]}</Chip>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Mentor / học viên ---------------- */

// Mentor không phải role: một MEMBER là mentor của lớp khi classes.mentorId === user.id
async function loadPersonDashboard(user) {
  const classes = await api.get("/classes");
  const teachingClasses = classes.filter((c) => c.mentorId === user.id);
  const learningClasses = classes.filter((c) => c.mentorId !== user.id);

  const [learning, teaching] = await Promise.all([
    Promise.all(
      learningClasses.map(async (c) => {
        const [progress, assignments] = await Promise.all([
          api.get(`/classes/${c.id}/progress`),
          api.get(`/classes/${c.id}/assignments`),
        ]);
        return { ...c, status: classStatus(c), progress, assignments };
      })
    ),
    Promise.all(
      teachingClasses.map(async (c) => {
        const [assignments, members] = await Promise.all([
          api.get(`/classes/${c.id}/assignments`),
          api.get(`/classes/${c.id}/members`),
        ]);
        // Một bài tập vừa bị xóa (404) không được làm hỏng cả trang tổng quan
        const perAssignment = await Promise.all(
          assignments.map((a) =>
            api
              .get(`/assignments/${a.id}/submissions`)
              .then((list) => list.map((s) => ({ ...s, assignment: a })))
              .catch(() => [])
          )
        );
        return { ...c, status: classStatus(c), assignments, members, submissions: perAssignment.flat() };
      })
    ),
  ]);

  const now = Date.now();
  const nextDeadlines = learning
    .flatMap((c) => c.assignments.map((a) => ({ ...a, className: c.name })))
    .filter((a) => new Date(a.deadline).getTime() > now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);
  // Học viên chỉ thấy bài nộp của chính mình: có bài nghĩa là đã nộp
  const upcoming = await Promise.all(
    nextDeadlines.map((a) =>
      api
        .get(`/assignments/${a.id}/submissions`)
        .then((list) => ({ ...a, submitted: list.length > 0 }))
        .catch(() => ({ ...a, submitted: null }))
    )
  );

  const toReview = teaching
    .flatMap((c) => {
      const nameOf = Object.fromEntries(c.members.map((m) => [m.memberId, m.name]));
      return c.submissions
        .filter((s) => s.score === null)
        .map((s) => ({ ...s, className: c.name, memberName: nameOf[s.memberId] ?? `Học viên #${s.memberId}` }));
    })
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

  return { learning, teaching, upcoming, toReview };
}

function PersonDashboard({ user }) {
  const { data, error, loading, reload } = useAsync(() => loadPersonDashboard(user), [user.id]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { learning, teaching, upcoming, toReview } = data;
  if (learning.length === 0 && teaching.length === 0) {
    return (
      <section className="panel">
        <EmptyState icon={School} title="Bạn chưa thuộc lớp nào">
          Khi Admin thêm bạn vào lớp, hoặc chỉ định bạn làm mentor, lớp đó sẽ hiện ở đây.
        </EmptyState>
      </section>
    );
  }

  const avgProgress = learning.length
    ? Math.round(learning.reduce((sum, c) => sum + c.progress.progress, 0) / learning.length)
    : 0;
  const weekAhead = Date.now() + 7 * 86_400_000;
  const dueThisWeek = upcoming.filter((a) => new Date(a.deadline).getTime() <= weekAhead && !a.submitted).length;

  const stats = [];
  if (learning.length) {
    stats.push(
      { icon: GraduationCap, label: "Lớp đang học", value: learning.length, note: "lớp bạn là học viên" },
      { icon: ClipboardCheck, label: "Tiến độ trung bình", value: `${avgProgress}%`, note: "bài học đã hoàn thành" },
      { icon: CalendarClock, label: "Cần nộp tuần này", value: dueThisWeek, note: "bài tập chưa nộp, hạn trong 7 ngày" }
    );
  }
  if (teaching.length) {
    stats.push(
      { icon: Presentation, label: "Lớp đang dạy", value: teaching.length, note: "lớp bạn là mentor" },
      { icon: Inbox, label: "Bài chờ chấm", value: toReview.length, note: "bài nộp chưa có điểm" }
    );
  }

  return (
    <div className="stack">
      <div className="stats stagger">
        {stats.map((s, i) => (
          <Stat key={s.label} {...s} i={i} />
        ))}
      </div>

      <div className="grid-2">
        <div className="stack">
          {teaching.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Lớp bạn dạy</h2>
              </div>
              <div className="class-cards stagger">
                {teaching.map((c, i) => (
                  <article key={c.id} className="class-card" style={{ "--i": i }}>
                    <div className="class-card-top">
                      <h3>{c.name}</h3>
                      <Chip tone={STATUS_TONE[c.status.key]}>{c.status.label}</Chip>
                    </div>
                    <p className="row-sub">
                      {formatDay(c.startDate)} – {formatDay(c.endDate)}
                    </p>
                    <dl className="mini-stats">
                      <div>
                        <dt>Học viên</dt>
                        <dd>{c.members.length}</dd>
                      </div>
                      <div>
                        <dt>Bài tập</dt>
                        <dd>{c.assignments.length}</dd>
                      </div>
                      <div>
                        <dt>Chờ chấm</dt>
                        <dd className={c.submissions.some((s) => s.score === null) ? "warn-text" : ""}>
                          {c.submissions.filter((s) => s.score === null).length}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          )}

          {learning.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Lớp bạn học</h2>
              </div>
              <div className="class-cards stagger">
                {learning.map((c, i) => (
                  <article key={c.id} className="class-card" style={{ "--i": i }}>
                    <div className="class-card-top">
                      <h3>{c.name}</h3>
                      <Chip tone={STATUS_TONE[c.status.key]}>{c.status.label}</Chip>
                    </div>
                    <div className="progress-line">
                      <ProgressBar value={c.progress.progress} label={`Tiến độ lớp ${c.name}`} />
                      <span className="progress-num">{c.progress.progress}%</span>
                    </div>
                    <p className="row-sub">
                      Đã học {c.progress.completedLessons}/{c.progress.totalLessons} bài · {c.assignments.length} bài tập
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="stack">
          {learning.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Deadline sắp tới</h2>
              </div>
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Không có deadline nào phía trước">
                  Bài tập mới mà mentor giao sẽ hiện ở đây.
                </EmptyState>
              ) : (
                <ul className="rows stagger">
                  {upcoming.map((a, i) => {
                    const d = deadlineInfo(a.deadline);
                    return (
                      <li key={a.id} className="row" style={{ "--i": i }}>
                        <div className="row-main">
                          <span className="row-title">{a.title}</span>
                          <span className="row-sub">
                            {a.className} · hạn {formatDateTime(a.deadline)}
                          </span>
                        </div>
                        {a.submitted ? <Chip tone="ok">Đã nộp</Chip> : <Chip tone={d.tone}>{d.label}</Chip>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {teaching.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Bài chờ chấm</h2>
                <span className="muted small">cũ nhất trước</span>
              </div>
              {toReview.length === 0 ? (
                <EmptyState icon={Inbox} title="Đã chấm hết">
                  Bài nộp mới của học viên sẽ hiện ở đây.
                </EmptyState>
              ) : (
                <ul className="rows stagger">
                  {toReview.slice(0, 6).map((s, i) => (
                    <li key={s.id} className="row" style={{ "--i": i }}>
                      <Avatar name={s.memberName} size={30} />
                      <div className="row-main">
                        <span className="row-title">{s.assignment.title}</span>
                        <span className="row-sub">
                          {s.memberName} · {s.className} · nộp {formatDateTime(s.submittedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Mảnh dùng chung ---------------- */

function Stat({ icon: Icon, label, value, note, i }) {
  return (
    <div className="stat" style={{ "--i": i }}>
      <span className="stat-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-note">{note}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Đang tải">
      <div className="stats">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat">
            <Skeleton width={36} height={36} radius={10} />
            <Skeleton width="50%" height={12} />
            <Skeleton width="35%" height={26} />
            <Skeleton width="70%" height={12} />
          </div>
        ))}
      </div>
      <div className="grid-2">
        {[0, 1].map((p) => (
          <section key={p} className="panel">
            <Skeleton width="30%" height={18} />
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="row">
                <Skeleton width={30} height={30} radius={99} />
                <div className="row-main" style={{ gap: 6 }}>
                  <Skeleton width="60%" height={13} />
                  <Skeleton width="40%" height={11} />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
