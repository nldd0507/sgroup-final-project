import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { BookOpenCheck, ClipboardCheck, Eye, EyeOff, LogIn, Users } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Logo } from "../components/Layout.jsx";
import { Spinner } from "../components/ui.jsx";

// Tài khoản seed chỉ hiện khi chạy `npm run dev`, không lộ ra bản build trên server
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      { label: "Admin", email: "admin@sgroup.com" },
      { label: "Mentor", email: "mentor@sgroup.com" },
      { label: "Học viên", email: "member@sgroup.com" },
    ]
  : [];
const DEMO_PASSWORD = "Password123!";

const FEATURES = [
  { icon: Users, title: "Lớp học và thành viên", text: "Admin mở lớp, chỉ định mentor, thêm học viên." },
  { icon: BookOpenCheck, title: "Bài học và tiến độ", text: "Học viên đánh dấu hoàn thành, thấy ngay % tiến độ." },
  { icon: ClipboardCheck, title: "Bài tập và chấm điểm", text: "Nộp bài trước deadline, mentor chấm và nhận xét." },
];

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || "/";
  if (status === "ready") return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="login">
      <section className="login-aside" aria-hidden="true">
        <Logo />
        <div className="login-pitch">
          <h2>Một chỗ cho cả lớp: bài học, bài tập, điểm số.</h2>
          <ul className="feature-list">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <li key={title} style={{ "--i": i }}>
                <span className="feature-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <b>{title}</b>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="login-foot">SGroup · Final project</p>
      </section>

      <section className="login-main">
        <form className="login-card" onSubmit={onSubmit} noValidate>
          <div className="only-mobile">
            <Logo />
          </div>
          <div>
            <h1>Đăng nhập</h1>
            <p className="muted">Tài khoản do Admin cấp. Chưa có tài khoản thì liên hệ Admin của SGroup.</p>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              placeholder="ten@sgroup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrap">
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-btn input-addon"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !email || !password}>
            {submitting ? <Spinner size={16} /> : <LogIn size={18} aria-hidden="true" />}
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>

          {DEMO_ACCOUNTS.length > 0 && (
            <div className="demo">
              <p className="demo-label">Tài khoản seed (chỉ hiện khi chạy dev)</p>
              <div className="demo-list">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.email} type="button" className="chip-btn" onClick={() => fillDemo(a.email)}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
