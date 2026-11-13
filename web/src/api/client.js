// Một chỗ duy nhất gọi backend: gắn token, tự gia hạn phiên khi access token hết hạn,
// và biến mọi lỗi thành ApiError có câu thông báo tiếng Việt để giao diện hiển thị.

const ACCESS_KEY = "sg.accessToken";
const REFRESH_KEY = "sg.refreshToken";

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* trình duyệt chặn localStorage: phiên chỉ sống tới khi tải lại trang */
  }
};

export const tokenStore = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  save({ accessToken, refreshToken }) {
    write(ACCESS_KEY, accessToken);
    if (refreshToken !== undefined) write(REFRESH_KEY, refreshToken);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Backend trả một số câu tiếng Anh: dịch những câu người dùng hay gặp
const TRANSLATIONS = [
  [/^Invalid email or password$/i, "Email hoặc mật khẩu không đúng."],
  [/^Email already exists$/i, "Email này đã có người dùng."],
  [/^Deadline has passed$/i, "Đã quá hạn nộp bài."],
  [/^You have already submitted/i, "Bạn đã nộp bài này rồi, mỗi người chỉ nộp một lần."],
  [/^Score must be between 0 and (\d+)/i, (m) => `Điểm phải từ 0 đến ${m[1]}.`],
  [/^Member already in class$/i, "Người này đã ở trong lớp."],
  [/^Member not in class$/i, "Người này không còn trong lớp."],
  [/^The mentor cannot be a member/i, "Mentor của lớp không thể đồng thời là học viên của lớp đó."],
  [/^End date must be after start date$/i, "Ngày kết thúc phải sau ngày bắt đầu."],
  [/^Lesson order already exists/i, "Đã có bài học khác dùng số thứ tự này trong lớp."],
  [/^Mentor not found$/i, "Không tìm thấy người được chọn làm mentor."],
  [/^Repository URL is not valid$/i, "Link repository không hợp lệ, phải bắt đầu bằng http:// hoặc https://."],
  [/^Only admin or the class mentor/i, "Chỉ Admin hoặc mentor của lớp xem được danh sách học viên."],
  [/^Too many failed login attempts\. Try again in (\d+) minutes?$/i, (m) => `Sai quá nhiều lần. Thử lại sau ${m[1]} phút.`],
  [/permission/i, "Bạn không có quyền thực hiện thao tác này."],
  [/^Only the mentor of this class/i, "Chỉ mentor của lớp mới làm được thao tác này."],
  [/^Only members of this class/i, "Chỉ học viên của lớp mới làm được thao tác này."],
  [/not found$/i, "Không tìm thấy dữ liệu yêu cầu."],
];

const FALLBACK = {
  0: "Không kết nối được tới server. Kiểm tra mạng rồi thử lại.",
  400: "Dữ liệu chưa hợp lệ.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  409: "Dữ liệu bị trùng.",
  429: "Bạn thao tác quá nhanh. Thử lại sau ít phút.",
};

const toMessage = (status, raw) => {
  if (raw) {
    for (const [pattern, replacement] of TRANSLATIONS) {
      const match = raw.match(pattern);
      if (match) return typeof replacement === "function" ? replacement(match) : replacement;
    }
    return raw;
  }
  return FALLBACK[status] || "Có lỗi xảy ra ở server. Thử lại sau.";
};

async function send(method, path, body, token) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, FALLBACK[0]);
  }
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  return { res, json };
}

// Nhiều request cùng gặp 401 thì chỉ gọi /auth/refresh-token một lần
let refreshing = null;
const refreshAccessToken = () => {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return Promise.resolve(null);
  refreshing ??= send("POST", "/auth/refresh-token", { refreshToken })
    .then(({ res, json }) => {
      if (!res.ok || !json?.data?.accessToken) return null;
      tokenStore.save({ accessToken: json.data.accessToken });
      return json.data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

export async function request(method, path, body, { auth = true } = {}) {
  let { res, json } = await send(method, path, body, auth ? tokenStore.access : null);

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) ({ res, json } = await send(method, path, body, newToken));
    if (res.status === 401) {
      tokenStore.clear();
      onSessionExpired();
    }
  }

  if (!res.ok) throw new ApiError(res.status, toMessage(res.status, json?.message));
  return json?.data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body = {}) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path) => request("DELETE", path),
};
