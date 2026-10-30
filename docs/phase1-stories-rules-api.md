# Phase 1 — User Stories, Business Rules, API Design

Đi kèm: [usecases.md](usecases.md), [erd.dbml](erd.dbml).

---

# PHẦN A — USER STORIES

Định dạng: *Là [vai trò], tôi muốn [việc], để [lợi ích].* — kèm tiêu chí chấp nhận (AC).

## Authentication
**US-01** Là người dùng, tôi muốn đăng nhập bằng email và password để truy cập hệ thống.
- AC: đúng thông tin → nhận JWT. Sai email hoặc password → 401, cùng một thông báo.

**US-02** Là người dùng đã đăng nhập, tôi muốn xem hồ sơ của mình để biết mình đang đăng nhập bằng tài khoản nào.
- AC: `GET /auth/me` trả id, name, email, role; không trả password.

## Admin
**US-03** Là Admin, tôi muốn tạo tài khoản user để thành viên có thể đăng nhập.
- AC: email không trùng; password được hash; password tối thiểu 8 ký tự.

**US-04** Là Admin, tôi muốn xem danh sách và chi tiết user để quản lý thành viên.

**US-05** Là Admin, tôi muốn sửa thông tin user (tên, role, đặt lại password) để cập nhật khi cần.

**US-06** Là Admin, tôi muốn tạo class (tên, mô tả, ngày bắt đầu/kết thúc) để mở lớp mới.
- AC: ngày kết thúc phải sau ngày bắt đầu; phải chọn mentor hợp lệ.

**US-07** Là Admin, tôi muốn sửa và xóa class để cập nhật hoặc đóng lớp.

**US-08** Là Admin, tôi muốn chỉ định (hoặc đổi) Mentor của class để có người phụ trách nội dung.
- AC: mentor phải là user tồn tại; mỗi class đúng một mentor.

**US-09** Là Admin, tôi muốn thêm Member vào class để họ được học lớp đó.
- AC: thêm trùng → 409.

**US-10** Là Admin, tôi muốn xóa Member khỏi class khi họ không còn tham gia.

**US-11** Là Admin, tôi muốn xem danh sách Member của một class để nắm lớp.

## Member
**US-12** Là Member, tôi muốn xem danh sách class mình tham gia để biết mình đang học gì.
- AC: không thấy class mình không tham gia.

**US-13** Là Member, tôi muốn xem danh sách và nội dung lesson của class để học theo thứ tự.
- AC: lesson sắp theo `order`; lesson của class khác → 403.

**US-14** Là Member, tôi muốn đánh dấu lesson đã hoàn thành để theo dõi tiến độ.
- AC: bấm nhiều lần không tạo bản ghi trùng.

**US-15** Là Member, tôi muốn xem phần trăm tiến độ của mình trong class để biết còn bao nhiêu bài.
- AC: `progress = completed / total × 100`; lớp chưa có lesson thì 0.

**US-16** Là Member, tôi muốn xem danh sách assignment của class để biết bài cần làm và deadline.

**US-17** Là Member, tôi muốn nộp bài (nội dung và/hoặc link repository) để mentor chấm.
- AC: phải có ít nhất một trong content/repositoryUrl; không nộp sau deadline; nộp tối đa một lần.

**US-18** Là Member, tôi muốn xem bài đã nộp, điểm và feedback của mình để biết kết quả.
- AC: không xem được bài của người khác.

## Mentor
**US-19** Là Mentor, tôi muốn tạo lesson cho class mình phụ trách để chia sẻ kiến thức.
- AC: không tạo được cho class khác; `order` không trùng trong class.

**US-20** Là Mentor, tôi muốn sửa và xóa lesson của class mình để cập nhật nội dung.

**US-21** Là Mentor, tôi muốn tạo assignment (tiêu đề, mô tả, deadline, điểm tối đa) cho class mình.

**US-22** Là Mentor, tôi muốn sửa và xóa assignment của class mình.

**US-23** Là Mentor, tôi muốn xem tất cả bài nộp của một assignment trong class mình để chấm.

**US-24** Là Mentor, tôi muốn chấm điểm và viết feedback cho bài nộp để member biết kết quả.
- AC: `0 ≤ score ≤ maximumScore`; không chấm được bài của class khác.

---

# PHẦN B — BUSINESS RULES

Mã BR dùng để tham chiếu trong code và test.

## Tài khoản & xác thực
- **BR-01** `email` là duy nhất trong hệ thống.
- **BR-02** Password phải hash (bcrypt) trước khi lưu; không bao giờ trả `passwordHash` ra API.
- **BR-03** Password tối thiểu 8 ký tự.
- **BR-04** Mọi API trừ `POST /auth/login` (và `/health`, `/docs`) yêu cầu JWT hợp lệ.
- **BR-05** Đăng nhập sai email hoặc sai password trả cùng thông báo lỗi.

## Class & Member
- **BR-06** Chỉ Admin được tạo, sửa, xóa class và quản lý user.
- **BR-07** `endDate` phải sau `startDate`.
- **BR-08** Mỗi class có đúng một Mentor; `mentorId` phải trỏ tới user tồn tại.
- **BR-09** Chỉ Admin được chỉ định Mentor và thêm/xóa Member.
- **BR-10** Một Member không được thêm hai lần vào cùng một class. Một Member được ở nhiều class.
- **BR-11** Xóa class thì xóa theo ClassMember, Lesson, LessonProgress, Assignment, Submission của class đó.
- **BR-12** Không được xóa user đang là Mentor của một class hoặc đã tạo lesson.
- **BR-13** Member chỉ xem class mình tham gia; Mentor chỉ xem class mình phụ trách; Admin xem tất cả.

## Lesson & Progress
- **BR-14** Chỉ Mentor của class mới tạo, sửa, xóa lesson của class đó.
- **BR-15** `order` của lesson là duy nhất trong một class.
- **BR-16** Chỉ Member thuộc class mới xem lesson và đánh dấu hoàn thành.
- **BR-17** Mỗi Member hoàn thành mỗi lesson tối đa một lần; thao tác lặp lại không tạo bản ghi mới.
- **BR-18** `progress (%) = round(completedLessons / totalLessons × 100)`; nếu `totalLessons = 0` thì 0.

## Assignment & Submission
- **BR-19** Chỉ Mentor của class mới tạo, sửa, xóa assignment của class đó.
- **BR-20** `maximumScore > 0`; `deadline` phải là thời điểm hợp lệ.
- **BR-21** Chỉ Member thuộc class mới nộp bài cho assignment của class đó.
- **BR-22** Mỗi Member nộp tối đa một lần cho mỗi assignment.
- **BR-23** Không được nộp sau `deadline`.
- **BR-24** Bài nộp phải có ít nhất một trong `content` hoặc `repositoryUrl`; `repositoryUrl` phải là URL hợp lệ.
- **BR-25** Chỉ Mentor của class mới xem toàn bộ bài nộp và chấm điểm; Member chỉ xem bài của chính mình.
- **BR-26** `0 ≤ score ≤ assignment.maximumScore`.
- **BR-27** Khi chấm, hệ thống ghi `reviewedAt = now`. Bài chưa chấm có `score = null`.
- **BR-28** Mentor của class A không được thao tác trên dữ liệu của class B.

---

# PHẦN C — THIẾT KẾ API

## C.1 Quy ước chung
- Base URL: `/` (không có prefix version trong MVP). Dữ liệu JSON.
- Xác thực: header `Authorization: Bearer <accessToken>`.
- ID là số nguyên. Thời gian theo ISO 8601 (`2026-11-01T09:00:00.000Z`).
- Định dạng lỗi thống nhất:
```json
{ "message": "Validation failed", "errors": [ { "field": "email", "message": "Invalid email" } ] }
```
(`errors` chỉ có khi là lỗi validation.)

| Status | Dùng khi |
|--------|----------|
| 200 | Thành công (GET, PATCH, các action) |
| 201 | Tạo mới thành công |
| 204 | Xóa thành công, không có body |
| 400 | Dữ liệu sai / vi phạm quy tắc đầu vào |
| 401 | Thiếu hoặc sai token, sai thông tin đăng nhập |
| 403 | Đã đăng nhập nhưng không có quyền |
| 404 | Không tìm thấy tài nguyên |
| 409 | Trùng (email, member trong class, order, submission) |
| 500 | Lỗi server (không lộ chi tiết) |

Ký hiệu quyền: **A** = Admin, **M** = Mentor của class liên quan, **S** = Member thuộc class, **Me** = chính chủ, **Any** = đã đăng nhập.

## C.2 Bảng tổng hợp endpoint

| # | Method | URL | Quyền | Status thành công | Lỗi có thể |
|---|--------|-----|-------|-------------------|-----------|
| 1 | POST | /auth/login | Public | 200 | 400, 401 |
| 2 | GET | /auth/me | Any | 200 | 401 |
| 3 | GET | /users | A | 200 | 401, 403 |
| 4 | GET | /users/:id | A | 200 | 401, 403, 404 |
| 5 | POST | /users | A | 201 | 400, 401, 403, 409 |
| 6 | PATCH | /users/:id | A | 200 | 400, 401, 403, 404, 409 |
| 7 | GET | /classes | Any (lọc theo vai trò) | 200 | 401 |
| 8 | GET | /classes/:id | A, M, S | 200 | 401, 403, 404 |
| 9 | POST | /classes | A | 201 | 400, 401, 403, 404 |
| 10 | PATCH | /classes/:id | A | 200 | 400, 401, 403, 404 |
| 11 | DELETE | /classes/:id | A | 204 | 401, 403, 404 |
| 12 | GET | /classes/:id/members | A, M | 200 | 401, 403, 404 |
| 13 | POST | /classes/:id/members | A | 201 | 400, 401, 403, 404, 409 |
| 14 | DELETE | /classes/:id/members/:memberId | A | 204 | 401, 403, 404 |
| 15 | GET | /classes/:id/lessons | A, M, S | 200 | 401, 403, 404 |
| 16 | GET | /lessons/:id | A, M, S | 200 | 401, 403, 404 |
| 17 | POST | /classes/:id/lessons | M | 201 | 400, 401, 403, 404, 409 |
| 18 | PATCH | /lessons/:id | M | 200 | 400, 401, 403, 404, 409 |
| 19 | DELETE | /lessons/:id | M | 204 | 401, 403, 404 |
| 20 | POST | /lessons/:id/complete | S | 200 | 401, 403, 404 |
| 21 | GET | /classes/:id/progress | S (của chính mình) | 200 | 401, 403, 404 |
| 22 | GET | /classes/:id/assignments | A, M, S | 200 | 401, 403, 404 |
| 23 | GET | /assignments/:id | A, M, S | 200 | 401, 403, 404 |
| 24 | POST | /classes/:id/assignments | M | 201 | 400, 401, 403, 404 |
| 25 | PATCH | /assignments/:id | M | 200 | 400, 401, 403, 404 |
| 26 | DELETE | /assignments/:id | M | 204 | 401, 403, 404 |
| 27 | POST | /assignments/:id/submissions | S | 201 | 400, 401, 403, 404, 409 |
| 28 | GET | /assignments/:id/submissions | M (tất cả), S (của mình) | 200 | 401, 403, 404 |
| 29 | GET | /submissions/:id | M, Me | 200 | 401, 403, 404 |
| 30 | PATCH | /submissions/:id/review | M | 200 | 400, 401, 403, 404 |

Ghi chú quyền:
- Admin được **xem** class, lesson, assignment (đọc), nhưng không tạo/sửa lesson/assignment.
- Admin không xem/chấm bài nộp (submission) trong MVP.
- Khi member không thuộc class: trả **403** (hoặc 404 nếu muốn ẩn sự tồn tại) — chọn một và dùng nhất quán. Đề xuất: 403.

## C.3 Chi tiết request / response

### Auth

**1. POST /auth/login**
```json
// Request
{ "email": "member1@sgroup.dev", "password": "Password123" }
// 200
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": 3, "name": "Member One", "email": "member1@sgroup.dev", "role": "MEMBER" }
}
// 401
{ "message": "Invalid email or password" }
```

**2. GET /auth/me** → 200
```json
{ "id": 3, "name": "Member One", "email": "member1@sgroup.dev", "role": "MEMBER" }
```

### Users

**3. GET /users** → 200 `[ { id, name, email, role, createdAt } ]`
**4. GET /users/:id** → 200 một user (cùng dạng).

**5. POST /users**
```json
// Request
{ "name": "Mentor One", "email": "mentor1@sgroup.dev", "password": "Password123", "role": "MEMBER" }
// 201 → user vừa tạo (không có password)
// 409 → { "message": "Email already exists" }
```
`role` mặc định `MEMBER`.

**6. PATCH /users/:id** — body: bất kỳ field trong `name`, `role`, `password` → 200 user sau cập nhật.

### Classes

**7. GET /classes** → 200 `[ { id, name, description, startDate, endDate, mentorId } ]`
- Admin: tất cả. Người khác: class mình là member hoặc mentor.

**8. GET /classes/:id** → 200
```json
{
  "id": 1, "name": "BE Basic - Batch 01", "description": "...",
  "startDate": "2026-11-01", "endDate": "2026-12-30",
  "mentor": { "id": 2, "name": "Mentor One" }
}
```

**9. POST /classes**
```json
// Request
{ "name": "BE Basic - Batch 01", "description": "...", "startDate": "2026-11-01", "endDate": "2026-12-30", "mentorId": 2 }
// 201 → class vừa tạo
// 400 → endDate <= startDate; 404 → mentor không tồn tại
```

**10. PATCH /classes/:id** — các field của POST (tùy chọn) → 200. Đổi `mentorId` ở đây chính là "chỉ định mentor".
**11. DELETE /classes/:id** → 204.

### Class members

**12. GET /classes/:id/members** → 200
```json
[ { "memberId": 3, "name": "Member One", "email": "member1@sgroup.dev", "joinedAt": "2026-11-01T08:00:00.000Z" } ]
```
**13. POST /classes/:id/members**
```json
// Request
{ "memberId": 3 }
// 201 → { "classId": 1, "memberId": 3, "joinedAt": "..." }
// 409 → { "message": "Member already in class" }
```
**14. DELETE /classes/:id/members/:memberId** → 204.

### Lessons

**15. GET /classes/:id/lessons** → 200 (sắp theo `order`)
```json
[ { "id": 10, "classId": 1, "title": "HTTP", "order": 2, "completed": true } ]
```
`completed` chỉ có ý nghĩa với Member (đã hoàn thành chưa); Mentor/Admin có thể bỏ qua field này.

**16. GET /lessons/:id** → 200
```json
{ "id": 10, "classId": 1, "title": "HTTP", "content": "...", "order": 2, "createdBy": 2 }
```

**17. POST /classes/:id/lessons**
```json
// Request
{ "title": "HTTP", "content": "...", "order": 2 }
// 201 → lesson (createdBy = user hiện tại)
// 409 → order đã tồn tại trong class
```
**18. PATCH /lessons/:id** — `title`, `content`, `order` (tùy chọn) → 200.
**19. DELETE /lessons/:id** → 204.

**20. POST /lessons/:id/complete** → 200 (không cần body)
```json
{ "lessonId": 10, "memberId": 3, "completedAt": "2026-11-05T10:00:00.000Z" }
```

**21. GET /classes/:id/progress** → 200
```json
{ "totalLessons": 10, "completedLessons": 7, "progress": 70 }
```

### Assignments

**22. GET /classes/:id/assignments** → 200 `[ { id, classId, title, deadline, maximumScore } ]`
**23. GET /assignments/:id** → 200 (thêm `description`).

**24. POST /classes/:id/assignments**
```json
// Request
{ "title": "HTTP API", "description": "...", "deadline": "2026-11-15T23:59:00.000Z", "maximumScore": 10 }
// 201 → assignment
// 400 → maximumScore <= 0 hoặc deadline không hợp lệ
```
**25. PATCH /assignments/:id** — các field tùy chọn → 200.
**26. DELETE /assignments/:id** → 204.

### Submissions

**27. POST /assignments/:id/submissions**
```json
// Request
{ "content": "Em đã hoàn thành...", "repositoryUrl": "https://github.com/user/repo" }
// 201
{ "id": 5, "assignmentId": 2, "memberId": 3, "content": "...", "repositoryUrl": "...", "submittedAt": "...", "score": null, "feedback": null, "reviewedAt": null }
// 400 → quá deadline / thiếu cả content và repositoryUrl; 409 → đã nộp rồi
```

**28. GET /assignments/:id/submissions** → 200 mảng submission (Mentor: cả lớp; Member: chỉ của mình).
**29. GET /submissions/:id** → 200 submission (dạng như trên).

**30. PATCH /submissions/:id/review**
```json
// Request
{ "score": 8, "feedback": "Làm tốt, cần bổ sung validation." }
// 200 → submission với score, feedback, reviewedAt
// 400 → score < 0 hoặc score > maximumScore
// 403 → không phải mentor của class chứa assignment này
```

## C.4 Checklist phân quyền cho từng endpoint (dùng khi code)
1. Có `authenticate` chưa? (trừ login)
2. Có `requireRole('ADMIN')` chưa? (nhóm users, classes ghi, class-members ghi)
3. Với route theo id con (`/lessons/:id`, `/assignments/:id`, `/submissions/:id`): đã truy ngược về `classId` rồi mới kiểm tra mentor/member chưa?
4. Response có lỡ trả `passwordHash` không?
5. Đã validate body bằng Zod chưa?
6. Đã có test cho trường hợp 401/403/404 chưa?

## C.5 Phân công
- **A:** endpoint 1–14 (auth, users, classes, class-members).
- **B:** endpoint 15–30 (lessons, progress, assignments, submissions).
