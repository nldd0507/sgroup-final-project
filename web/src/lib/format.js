// Ngày từ API: lớp học dạng "YYYY-MM-DD", deadline và createdAt dạng ISO đầy đủ.

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const longDateFmt = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" });

// "2026-11-01" phải hiểu là ngày theo lịch, không lệch múi giờ
const parseDay = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDay = (ymd) => (ymd ? dateFmt.format(parseDay(ymd)) : "");
const pad = (n) => String(n).padStart(2, "0");

// "04/11, 08:06" theo giờ máy người xem
export const formatDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const formatToday = () => longDateFmt.format(new Date());

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Trạng thái lớp theo ngày hôm nay
export const classStatus = (c) => {
  const today = todayYmd();
  if (today < c.startDate) return { key: "upcoming", label: "Sắp mở" };
  if (today > c.endDate) return { key: "ended", label: "Đã kết thúc" };
  return { key: "ongoing", label: "Đang học" };
};

// "còn 3 ngày", "còn 5 giờ", "đã quá hạn"
export const deadlineInfo = (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { label: "Đã quá hạn", tone: "danger" };
  const hours = ms / 3_600_000;
  if (hours < 1) return { label: `Còn ${Math.max(1, Math.round(ms / 60_000))} phút`, tone: "danger" };
  if (hours < 24) return { label: `Còn ${Math.round(hours)} giờ`, tone: "danger" };
  const days = Math.round(hours / 24);
  return { label: `Còn ${days} ngày`, tone: days <= 3 ? "warn" : "neutral" };
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
