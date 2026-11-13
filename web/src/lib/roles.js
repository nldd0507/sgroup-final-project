// Mentor không phải là role trong DB: một user MEMBER là mentor của lớp khi classes.mentorId === user.id.
// Hàm này trả vai trò của người đang đăng nhập đối với một lớp cụ thể.
export function roleInClass(user, cls) {
  if (!user || !cls) return null;
  const mentorId = cls.mentorId ?? cls.mentor?.id;
  if (mentorId === user.id) return "mentor";
  if (user.role === "ADMIN") return "admin";
  return "member";
}

export const ROLE_IN_CLASS_LABEL = { admin: "Admin", mentor: "Mentor", member: "Học viên" };

// Chuyển giữa ISO (API) và giá trị của <input type="datetime-local"> (giờ máy người dùng)
export const isoToLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const localInputToIso = (value) => new Date(value).toISOString();
