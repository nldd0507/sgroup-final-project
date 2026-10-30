# Use Cases — S-Group Learning Platform

## 1. Actors
| Actor | Mô tả |
|-------|-------|
| Admin | `user.role = ADMIN`. Quản lý user, class, mentor, member. |
| Member | `user.role = MEMBER`. Học, nộp bài, xem điểm. |
| Mentor | Không phải role. Là Member mà `class.mentorId = user.id`. Mentor **kế thừa** mọi quyền Member (nếu cũng được thêm vào class) và có thêm quyền quản lý lesson/assignment/review **trong class mình phụ trách**. |

## 2. Danh sách Use Case

| ID | Use Case | Actor |
|----|----------|-------|
| UC-01 | Đăng nhập | Tất cả |
| UC-02 | Xem hồ sơ của mình (`/auth/me`) | Tất cả |
| UC-03 | Quản lý user (list/xem/tạo/sửa) | Admin |
| UC-04 | Quản lý class (CRUD) | Admin |
| UC-05 | Chỉ định Mentor cho class | Admin |
| UC-06 | Thêm / xóa Member khỏi class | Admin |
| UC-07 | Xem class của mình | Member, Mentor |
| UC-08 | Quản lý lesson (CRUD) | Mentor |
| UC-09 | Xem lesson | Member, Mentor |
| UC-10 | Đánh dấu hoàn thành lesson | Member |
| UC-11 | Xem tiến độ học (progress) | Member |
| UC-12 | Quản lý assignment (CRUD) | Mentor |
| UC-13 | Xem assignment | Member, Mentor |
| UC-14 | Nộp bài (submit) | Member |
| UC-15 | Xem submission (của mình / của cả lớp) | Member, Mentor |
| UC-16 | Chấm điểm + feedback (review) | Mentor |
| UC-17 | Xem điểm và feedback | Member |

---

## 3. Đặc tả chi tiết các Use Case quan trọng

### UC-01 Đăng nhập
- **Actor:** Tất cả
- **Tiền điều kiện:** user đã tồn tại trong hệ thống
- **Luồng chính:**
  1. Gửi `POST /auth/login` với email + password.
  2. Hệ thống tìm user theo email, so khớp password với hash.
  3. Hệ thống ký JWT và trả `accessToken` + thông tin user.
- **Luồng lỗi:** thiếu/sai định dạng email hoặc password → 400. Sai email hoặc password → 401 (cùng một thông báo).
- **Hậu điều kiện:** client có token để gọi các API khác.

### UC-04 Quản lý class
- **Actor:** Admin
- **Tiền điều kiện:** đã đăng nhập, role = ADMIN
- **Luồng chính:** Admin tạo/xem/sửa/xóa class với name, description, startDate, endDate, mentorId.
- **Luồng lỗi:** không phải Admin → 403; `endDate <= startDate` → 400; `mentorId` không tồn tại → 404; class không tồn tại → 404.
- **Hậu điều kiện:** khi xóa class, lesson/assignment/class member/progress/submission thuộc class bị xóa theo.

### UC-06 Thêm Member vào class
- **Actor:** Admin
- **Tiền điều kiện:** class và user tồn tại
- **Luồng chính:** `POST /classes/:id/members {memberId}` → tạo ClassMember với `joinedAt = now`.
- **Luồng lỗi:** member đã có trong class → 409; class/user không tồn tại → 404; không phải Admin → 403.

### UC-07 Xem class của mình
- **Actor:** Member, Mentor
- **Luồng chính:** `GET /classes` trả danh sách class mà user là member hoặc là mentor. `GET /classes/:id` trả chi tiết.
- **Luồng lỗi:** xem class mình không thuộc → 403 (hoặc 404); Admin xem được tất cả.

### UC-08 Quản lý lesson
- **Actor:** Mentor
- **Tiền điều kiện:** user là mentor của class chứa lesson
- **Luồng chính:** tạo (`POST /classes/:id/lessons`), sửa/xóa (`PATCH|DELETE /lessons/:id`).
- **Luồng lỗi:** không phải mentor của class đó → 403 (kể cả mentor lớp khác); `order` trùng trong class → 409; dữ liệu sai → 400.

### UC-10 Hoàn thành lesson
- **Actor:** Member
- **Tiền điều kiện:** member thuộc class của lesson
- **Luồng chính:** `POST /lessons/:id/complete` → tạo LessonProgress (`completedAt = now`).
- **Luồng lỗi:** không thuộc class → 403; lesson không tồn tại → 404.
- **Ghi chú:** gọi lần 2 không tạo bản ghi mới (idempotent).

### UC-11 Xem tiến độ
- **Actor:** Member
- **Luồng chính:** `GET /classes/:id/progress` → `{totalLessons, completedLessons, progress}`; `progress = round(completed / total * 100)`, `total = 0` thì `progress = 0`.
- **Luồng lỗi:** không thuộc class → 403.

### UC-12 Quản lý assignment
- **Actor:** Mentor
- **Tiền điều kiện:** là mentor của class
- **Luồng chính:** CRUD assignment: title, description, deadline, maximumScore.
- **Luồng lỗi:** không phải mentor của class → 403; `maximumScore <= 0` → 400.

### UC-14 Nộp bài
- **Actor:** Member
- **Tiền điều kiện:** member thuộc class của assignment; chưa quá deadline; chưa nộp assignment này
- **Luồng chính:** `POST /assignments/:id/submissions {content, repositoryUrl}` → tạo Submission với `submittedAt = now`.
- **Luồng lỗi:** không thuộc class → 403; quá deadline → 400; đã nộp → 409; thiếu cả content và repositoryUrl → 400.

### UC-15 Xem submission
- **Actor:** Member, Mentor
- **Luồng chính:** Mentor của class xem tất cả submission của assignment; Member chỉ xem submission của chính mình.
- **Luồng lỗi:** Member xem bài người khác → 403; Mentor class khác → 403.

### UC-16 Review submission
- **Actor:** Mentor
- **Tiền điều kiện:** là mentor của class chứa assignment của submission
- **Luồng chính:** `PATCH /submissions/:id/review {score, feedback}` → lưu score, feedback, `reviewedAt = now`.
- **Luồng lỗi:** không phải mentor của class đó → 403; `score < 0` hoặc `score > maximumScore` → 400; submission không tồn tại → 404.

### UC-17 Xem điểm và feedback
- **Actor:** Member
- **Luồng chính:** `GET /submissions/:id` (của mình) trả về score, feedback, reviewedAt.
- **Ghi chú:** chưa chấm thì `score = null`.

---

## 4. Quyết định thiết kế đã chốt (ghi vào Business Rules)
- Một class có **đúng 1 mentor**.
- Một member có thể ở **nhiều class**.
- Nộp bài **một lần** cho mỗi assignment; **không** nộp sau deadline.
- Mentor chỉ thao tác trong class mình phụ trách.
- Admin không tạo lesson/assignment; Admin xem được mọi class.
- Xóa class → xóa theo toàn bộ dữ liệu con (CASCADE). Xóa user đang là mentor hoặc đã tạo lesson → bị chặn (RESTRICT).
