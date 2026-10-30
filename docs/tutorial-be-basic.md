# Tutorial: S-Group Learning Platform (BE Basic) — Làm nhóm 2 người

> Mục tiêu: đạt **Level 7** (MVP hoàn chỉnh). Không cần làm Level 8–10.
> Thời gian đề xuất: **14 ngày** (người mới). Nếu đã quen Node.js thì ép được còn ~10 ngày.

---

## PHẦN 1 — ĐỀ BÀI YÊU CẦU GÌ?

### 1.1 Một câu tóm tắt
Xây **một Backend (chỉ API, không cần giao diện)** cho hệ thống quản lý lớp học nội bộ: Admin tạo lớp & thêm thành viên, Mentor đăng bài học & bài tập, Member học, nộp bài, xem điểm.

### 1.2 Bạn phải NỘP 8 thứ (Deliverables)
| # | Sản phẩm | Nội dung |
|---|----------|----------|
| 1 | Requirement Analysis | User Stories, Use Cases, Business Rules |
| 2 | ERD | Sơ đồ database + quan hệ |
| 3 | API Documentation | Danh sách API + request/response (Swagger) |
| 4 | Source code | Backend hoàn chỉnh |
| 5 | Database | Migration + Seed data |
| 6 | Tests | Test tự động cho logic quan trọng |
| 7 | Docker | `docker compose up` chạy được Backend + DB |
| 8 | README | Hướng dẫn cài & chạy |

### 1.3 Yêu cầu kỹ thuật bắt buộc
- Node.js + (Express hoặc NestJS) + **TypeScript**
- PostgreSQL hoặc MySQL
- REST API, Validation, Error handling, Authentication (JWT), Authorization (phân quyền)
- Migration, Seed, API docs (Swagger khuyến khích)

### 1.4 Tiêu chí hoàn thành (Definition of Done — 22 mục)
Đây là "bảng chấm điểm" của bạn. In ra, tick dần:

- [ ] Login hoạt động
- [ ] JWT authentication hoạt động
- [ ] Authorization hoạt động
- [ ] Admin tạo được Class
- [ ] Admin chỉ định Mentor
- [ ] Admin thêm Member vào Class
- [ ] Member xem được Class của mình
- [ ] Mentor tạo được Lesson
- [ ] Member xem được Lesson
- [ ] Member đánh dấu Lesson Completed
- [ ] Hệ thống tính được Progress (%)
- [ ] Mentor tạo Assignment
- [ ] Member submit Assignment
- [ ] Mentor review Submission (chấm điểm + feedback)
- [ ] Member xem Score và Feedback
- [ ] Validation hoạt động
- [ ] Error handling hoạt động
- [ ] Business rules quan trọng được enforce
- [ ] Migration/seed hoạt động
- [ ] API documentation có sẵn
- [ ] Có automated tests cơ bản
- [ ] Chạy được bằng Docker

### 1.5 Điều quan trọng nhất đề muốn kiểm tra
Đề nói rõ: **không phải viết thật nhiều API**, mà là thực hiện được quy trình:

```
Yêu cầu nghiệp vụ → Phân tích → Domain model → Thiết kế DB → Thiết kế API → Code → Test → Deploy (Docker)
```
Nên **Phase 1 (phân tích, ERD, thiết kế API) không được bỏ qua** — nó là phần ăn điểm.

---

## PHẦN 2 — MÔ HÌNH HỆ THỐNG HƯỚNG ĐẾN

### 2.1 Bức tranh tổng thể

```
                         ┌──────────┐
                         │  ADMIN   │ (role = ADMIN)
                         └────┬─────┘
        tạo lớp, chỉ định mentor, thêm/xóa member, quản lý user
                              ▼
                       ┌─────────────┐   mentorId ──► User (người làm Mentor)
                       │    CLASS    │
                       └──┬───────┬──┘
          ┌───────────────┤       ├───────────────────┐
          ▼               ▼       ▼                   ▼
   ClassMember        Lesson   Assignment ...   (Member thuộc lớp)
 (classId,memberId)      │          │
                         ▼          ▼
                  LessonProgress  Submission  (có score, feedback)
```

### 2.2 Các entity (7 bảng) và quan hệ

```
User ──< ClassMember >── Class          (nhiều-nhiều: 1 member vào nhiều class)
User ──< Class.mentorId                 (1 user làm mentor nhiều class; 1 class có đúng 1 mentor)
Class ──< Lesson ──< LessonProgress >── User
Class ──< Assignment ──< Submission >── User
```

| Entity | Trường chính | Ghi chú quan trọng |
|--------|-------------|--------------------|
| User | id, name, email (unique), passwordHash, role (ADMIN/MEMBER) | Không lưu password gốc |
| Class | id, name, description, startDate, endDate, mentorId | mentorId → User |
| ClassMember | classId, memberId, joinedAt | **Unique (classId, memberId)** chống trùng |
| Lesson | id, classId, title, content, order, createdBy | |
| LessonProgress | id, lessonId, memberId, completedAt | **Unique (lessonId, memberId)** |
| Assignment | id, classId, title, description, deadline, maximumScore | |
| Submission | id, assignmentId, memberId, content, repositoryUrl, submittedAt, score, feedback, reviewedAt | score ≤ maximumScore |

### 2.3 "Mentor" không phải là role!
Chỉ có 2 role: `ADMIN`, `MEMBER`. Một user là Mentor **của class X** khi `class.mentorId == user.id`.
→ Mỗi lần Mentor làm gì, code phải kiểm tra: *"user này có phải mentor của class chứa lesson/assignment này không?"*

### 2.4 Ma trận phân quyền (cực kỳ quan trọng)

| Hành động | ADMIN | Mentor của class đó | Member trong class | Người khác |
|-----------|:----:|:----:|:----:|:----:|
| Quản lý user | ✅ | ❌ | ❌ | ❌ |
| CRUD class, gán mentor, thêm/xóa member | ✅ | ❌ | ❌ | ❌ |
| Xem class | ✅ (tất cả) | ✅ (lớp mình) | ✅ (lớp mình tham gia) | ❌ |
| CRUD lesson | ❌ | ✅ | ❌ | ❌ |
| Xem lesson | ✅ | ✅ | ✅ (lớp mình) | ❌ |
| Complete lesson / xem progress | ❌ | ❌ | ✅ | ❌ |
| CRUD assignment | ❌ | ✅ | ❌ | ❌ |
| Xem assignment | ✅ | ✅ | ✅ (lớp mình) | ❌ |
| Submit assignment | ❌ | ❌ | ✅ | ❌ |
| Xem submission | ✅ | ✅ (cả lớp) | ✅ (chỉ của mình) | ❌ |
| Review (chấm điểm) | ❌ | ✅ | ❌ | ❌ |

> Đề không nói Admin có được tạo lesson không → **bạn tự quyết và ghi vào Business Rules**. Gợi ý trên: chỉ Mentor.

### 2.5 Luồng chính (để hiểu "cả hệ thống chạy thế nào")
1. Admin tạo user (Mentor, Member A, B) → tạo Class "BE Basic - Batch 01", đặt `mentorId`.
2. Admin thêm Member A, B vào class.
3. Mentor đăng Lesson 1..5, Assignment 1.
4. Member A login → xem class → đọc lesson → bấm complete → `GET /classes/:id/progress` ra 20%.
5. Member A submit assignment (link GitHub).
6. Mentor xem submission → chấm 8/10 + feedback.
7. Member A xem điểm & feedback.

---

## PHẦN 3 — CÔNG NGHỆ NÊN CHỌN (cho người mới)

| Thành phần | Chọn | Lý do |
|------------|------|-------|
| Framework | **Express + TypeScript** | Đơn giản hơn NestJS, ít khái niệm trừu tượng |
| Database | **PostgreSQL** | Phổ biến, Docker image sẵn |
| ORM + Migration + Seed | **Prisma** | Viết schema 1 file → tự sinh migration, có type an toàn |
| Validation | **Zod** | Ngắn gọn, TypeScript-friendly |
| Password | **bcrypt** (hoặc bcryptjs) | Hash mật khẩu |
| JWT | **jsonwebtoken** | |
| API docs | **swagger-ui-express** + file OpenAPI | |
| Test | **Jest + Supertest** (+ ts-jest) | Test gọi API thật |
| Chạy dev | **tsx** hoặc ts-node-dev | Chạy TS không cần build |

Cài trước: Node.js 20+ LTS, Git, Docker Desktop, VS Code, Postman/Insomnia (hoặc extension REST Client), DBeaver/TablePlus (xem DB).

---

## PHẦN 4 — LỊCH 14 NGÀY & PHÂN CHIA 2 NGƯỜI

Gọi 2 người là **A** và **B**.

### 4.1 Nguyên tắc chia
- Cả hai cùng làm **Phase 1 (phân tích/thiết kế)** — vì ai cũng phải hiểu toàn bộ hệ thống.
- Sau đó chia theo **module dọc** (mỗi người tự làm từ route → service → test), tránh sửa chung file.
- **A = "Nền tảng + Lớp học"**, **B = "Học tập + Bài tập"**.

| | **Người A** (Foundation & Class) | **Người B** (Learning & Assignment) |
|---|---|---|
| Phụ trách | Setup project, Auth, middleware phân quyền, User, Class, ClassMember, Docker, README | Lesson, LessonProgress, Progress, Assignment, Submission, Review, Swagger |
| Bảng sở hữu | User, Class, ClassMember | Lesson, LessonProgress, Assignment, Submission |
| Tài liệu | Use Cases, ma trận phân quyền | User Stories, Business Rules, ERD |
| Test | login, authorization, duplicate member, member vào class khác | score validation, mentor class khác, submit |

### 4.2 Lịch từng ngày

| Ngày | Phase | A | B |
|------|-------|---|---|
| 1 | 1 Analysis | Cùng đọc đề, trả lời 15 Challenge Questions (Phần 6) | (cùng) |
| 2 | 1 Analysis | Use Cases + ma trận phân quyền | User Stories + Business Rules |
| 3 | 1 Analysis | Cùng vẽ **ERD** (dbdiagram.io) + chốt danh sách API | (cùng) |
| 4 | Setup | Khởi tạo project, Prisma schema, migration, Docker DB, push GitHub | Học Prisma/Express cơ bản, chuẩn bị Swagger file, viết trước seed data mẫu |
| 5 | 2 Auth | Login, JWT, `/auth/me`, middleware `authenticate`, `requireRole` | Error handler chung + Zod validate middleware (dùng chung) |
| 6 | 3 Class | CRUD User (Admin) | Đọc code A, viết helper `isMentorOfClass`, `isMemberOfClass` |
| 7 | 3 Class | CRUD Class + gán Mentor | CRUD Lesson (Mentor) |
| 8 | 3/4 | ClassMember (thêm/xóa/list, chống trùng) | Lesson view (Member), LessonProgress complete |
| 9 | 4 Learning | Class view theo role (Member chỉ thấy lớp mình) | `GET /classes/:id/progress` + test |
| 10 | 5 Assign | Seed data đầy đủ + hỗ trợ B | CRUD Assignment |
| 11 | 5 Assign | Test auth/class | Submission: submit + xem |
| 12 | 5 Assign | Docker compose đầy đủ (backend + db) | Review submission + validate score |
| 13 | 6 Test | Test phần A + README | Test phần B + Swagger hoàn thiện |
| 14 | 6 | **Cả hai**: chạy hết checklist DoD, fix bug, ghi demo | (cùng) |

### 4.3 Quy tắc Git cho nhóm (tránh xung đột — rất quan trọng)
- Nhánh `main` luôn chạy được. Mỗi người tạo nhánh riêng: `feat/auth`, `feat/lesson`...
- Quy trình mỗi tính năng: `git checkout -b feat/xxx` → code → commit → push → tạo Pull Request → người kia review → merge.
- **File `schema.prisma` là điểm dễ xung đột nhất**: chốt toàn bộ schema trong Ngày 3–4 (A viết, B review). Sau đó ai cần đổi phải báo nhau trước.
- Mỗi người chỉ sửa thư mục module của mình. File dùng chung (`app.ts`, `routes/index.ts`) → chỉ thêm 1 dòng đăng ký route, merge thường xuyên (mỗi ngày kéo `main` về: `git pull origin main`).
- Họp 10 phút đầu & cuối ngày: hôm nay làm gì, đang kẹt gì.

---

## PHẦN 5 — TUTORIAL TỪNG BƯỚC

### PHASE 1 — PHÂN TÍCH (Ngày 1–3, KHÔNG CODE)

**Bước 1.1 – Trả lời 15 Challenge Questions** (đáp án gợi ý ở Phần 6). Ghi vào file `docs/01-requirements.md`.

**Bước 1.2 – User Stories.** Mẫu: *"Là một [vai trò], tôi muốn [việc], để [lợi ích]."*
Ví dụ:
- Là Admin, tôi muốn thêm Member vào Class để họ truy cập nội dung học.
- Là Member, tôi muốn đánh dấu hoàn thành bài học để theo dõi tiến độ.
Viết ~15–20 stories, chia theo role.

**Bước 1.3 – Use Cases.** Mỗi use case gồm: Tên, Actor, Điều kiện trước, Luồng chính, Luồng lỗi. Ví dụ "Submit assignment": Actor = Member; điều kiện: đã login, thuộc class; luồng lỗi: không thuộc class → 403, assignment không tồn tại → 404, dữ liệu sai → 400.
Làm cho ~8–10 use case quan trọng nhất.

**Bước 1.4 – Business Rules** (đánh số BR-01, BR-02... để test sau này tham chiếu). Ví dụ:
- BR-01: Email unique.
- BR-02: Một Member không thêm 2 lần vào cùng Class.
- BR-03: Score ≥ 0 và ≤ maximumScore.
- BR-04: Mentor chỉ quản lý lesson/assignment/submission của class mình phụ trách.
- BR-05: Member chỉ xem dữ liệu của class mình tham gia.
- BR-06: Member không submit assignment của class mình không tham gia.

**Bước 1.5 – ERD.** Vào https://dbdiagram.io , vẽ 7 bảng theo mục 2.2. Với mỗi bảng ghi: PK, FK, unique, index, hành vi khi xóa. Gợi ý:
- `ClassMember`: unique(classId, memberId); xóa Class → xóa theo (CASCADE).
- `Lesson`, `Assignment`: xóa Class → CASCADE.
- `Class.mentorId`: xóa User → **RESTRICT** (không cho xóa user đang làm mentor).
- `Submission`: unique(assignmentId, memberId) nếu cho nộp 1 lần.
- Index: các cột FK hay tra cứu (`classId`, `memberId`, `assignmentId`), `email`.
Xuất ảnh vào `docs/erd.png`.

**Bước 1.6 – Thiết kế API.** Dùng danh sách gợi ý trong đề (mục 14), làm bảng gồm: Method | URL | Ai được gọi | Body | Response | Status code. Ví dụ:

| POST | /classes | ADMIN | {name,description,startDate,endDate,mentorId} | 201 + class | 400/401/403/404 |

Quy ước status code: 200 OK, 201 tạo mới, 204 xóa thành công, 400 dữ liệu sai, 401 chưa đăng nhập/token sai, 403 không đủ quyền, 404 không tìm thấy, 409 trùng (duplicate).

Quy ước format lỗi thống nhất: `{ "message": "...", "errors": [...] }`.

---

### PHASE 2 — SETUP PROJECT (Ngày 4, người A làm, B xem cùng)

```bash
mkdir s-group-lms && cd s-group-lms
git init
npm init -y
npm i express cors dotenv bcryptjs jsonwebtoken zod @prisma/client swagger-ui-express
npm i -D typescript tsx @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/swagger-ui-express prisma jest ts-jest @types/jest supertest @types/supertest
npx tsc --init
npx prisma init
```

**Cấu trúc thư mục gợi ý** (chia theo module để 2 người ít đụng nhau):

```
src/
  app.ts                 # tạo express app (export, để test dùng)
  server.ts              # app.listen
  config/env.ts
  middlewares/
    authenticate.ts      # đọc JWT, gắn req.user
    requireRole.ts
    validate.ts          # chạy Zod schema
    errorHandler.ts
  utils/
    AppError.ts          # class lỗi có statusCode
    permissions.ts       # isMentorOfClass, isMemberOfClass
  modules/
    auth/       (routes, controller, service, schema)
    users/
    classes/
    class-members/
    lessons/
    progress/
    assignments/
    submissions/
prisma/
  schema.prisma
  seed.ts
tests/
docs/
docker-compose.yml
Dockerfile
README.md
```

**Mẫu phân tầng (mỗi module giống nhau — học 1 lần dùng cho tất cả):**
- `routes.ts`: khai báo URL + gắn middleware (authenticate, requireRole, validate).
- `controller.ts`: lấy dữ liệu từ `req`, gọi service, trả `res`. **Không** chứa logic nghiệp vụ.
- `service.ts`: logic nghiệp vụ + gọi Prisma. Ném `AppError` khi vi phạm rule.
- `schema.ts`: Zod schema cho body/params.

**Bước 4.1 – Database bằng Docker.** Tạo `docker-compose.yml` ban đầu chỉ có service `db` (image `postgres:16`, set `POSTGRES_USER/PASSWORD/DB`, map port 5432, thêm volume). Chạy `docker compose up -d db`. Điền `DATABASE_URL` trong `.env` (nhớ thêm `.env` vào `.gitignore`, tạo `.env.example` để commit).

**Bước 4.2 – Viết `prisma/schema.prisma`** theo ERD: model `User`, `Class`, `ClassMember`, `Lesson`, `LessonProgress`, `Assignment`, `Submission`, enum `Role`. Dùng `@@unique([classId, memberId])`, `@relation(onDelete: Cascade)`, `@@index`. Rồi:

```bash
npx prisma migrate dev --name init
```
→ sinh thư mục `prisma/migrations` (đây chính là "Migration" nộp bài). Mở DBeaver kiểm tra bảng.

**Bước 4.3 – Hello world.** Tạo `app.ts` với `GET /health` trả `{status:"ok"}`; `server.ts` listen port 3000; thêm script `"dev": "tsx watch src/server.ts"`. Chạy `npm run dev`, gọi thử bằng trình duyệt.

**Bước 4.4 – Đẩy lên GitHub**, mời bạn cùng nhóm, cả hai clone về và chạy được.

---

### PHASE 3 — AUTHENTICATION & AUTHORIZATION (Ngày 5, A làm; B làm error + validate)

**Bước 5.1 – AppError + errorHandler (B).**
- `AppError(statusCode, message)`.
- `errorHandler(err, req, res, next)`: nếu là AppError → trả đúng status; nếu là ZodError → 400 kèm danh sách lỗi; còn lại → 500 (không lộ stack ra ngoài). Đăng ký **cuối cùng** trong app.
- Prisma lỗi trùng unique có mã `P2002` → map sang 409; không tìm thấy `P2025` → 404.

**Bước 5.2 – validate middleware (B).** Nhận Zod schema, parse `req.body`, lỗi thì chuyển cho errorHandler.

**Bước 5.3 – Seed user (A).** Viết `prisma/seed.ts`: 1 admin, 2 mentor-user, vài member (password hash bằng bcrypt). Thêm vào package.json `"prisma": {"seed": "tsx prisma/seed.ts"}`, chạy `npx prisma db seed`. Seed phải chạy lại được nhiều lần (dùng `upsert`).

**Bước 5.4 – `POST /auth/login` (A).** Quy trình trong service:
1. Tìm user theo email. Không có → 401 "Invalid email or password" (**cùng một thông báo** cho cả sai email lẫn sai password, tránh lộ thông tin).
2. `bcrypt.compare(password, user.passwordHash)`. Sai → 401.
3. Ký JWT: payload `{ sub: user.id, role }`, secret từ `.env`, hạn ví dụ 1d.
4. Trả `{ accessToken, user }` (**không** trả passwordHash).

**Bước 5.5 – `authenticate` middleware.** Đọc header `Authorization: Bearer <token>` → `jwt.verify` → nạp user (hoặc dùng payload) vào `req.user`. Thiếu/sai token → 401. (Nhớ khai báo type mở rộng cho `req.user` trong TypeScript.)

**Bước 5.6 – `GET /auth/me`** dùng authenticate, trả thông tin user hiện tại.

**Bước 5.7 – `requireRole('ADMIN')` middleware.** Sai role → 403.

**Bước 5.8 – `utils/permissions.ts`** (A viết, B dùng):
- `isMentorOfClass(userId, classId)`: tìm class theo id, so `mentorId`.
- `isMemberOfClass(userId, classId)`: tìm ClassMember.
- `assertCanViewClass(user, classId)`: Admin ✔, Mentor ✔, Member trong lớp ✔, còn lại ném 403.
**Mẹo:** gọi các hàm này ở **service**, không rải ở route.

**Kiểm thử thủ công:** dùng Postman gọi login → copy token → gọi `/auth/me`. Thử token sai, thiếu token.

---

### PHASE 3 (tiếp) — USER, CLASS, CLASSMEMBER (Ngày 6–9)

**Người A – Users (Ngày 6)**: `GET/POST/PATCH /users`, `GET /users/:id` — toàn bộ chỉ ADMIN. Validate email hợp lệ, password ≥ 8 ký tự; hash trước khi lưu; **không bao giờ trả passwordHash** (dùng `select` của Prisma). Email trùng → 409.

**Người A – Classes (Ngày 7)**:
- `POST /classes` (ADMIN): validate `endDate > startDate`, `mentorId` phải là user tồn tại (404 nếu không).
- `GET /classes`: ADMIN → tất cả; Member → chỉ lớp có record ClassMember của mình; Mentor → lớp có `mentorId` = mình. (Gợi ý: trả hợp của hai điều kiện sau cho non-admin.)
- `GET /classes/:id`: dùng `assertCanViewClass`.
- `PATCH`, `DELETE` (ADMIN). Xóa cascade lesson/assignment — hãy chắc bạn hiểu mình đã cấu hình gì ở schema.

**Người A – ClassMember (Ngày 8)**:
- `POST /classes/:id/members` body `{memberId}` (ADMIN). Kiểm tra class và user tồn tại; bắt lỗi unique → 409 "Member already in class". Bạn nên vừa kiểm tra bằng code vừa dựa vào unique constraint ở DB (an toàn khi 2 request cùng lúc).
- `GET /classes/:id/members` (ADMIN + Mentor của lớp).
- `DELETE /classes/:id/members/:memberId` (ADMIN) → 204.

**Người B – Lessons (Ngày 7–8)**:
- `POST /classes/:id/lessons`: authenticate → validate → service: `isMentorOfClass` else 403 → tạo lesson, `createdBy = req.user.id`.
- `GET /classes/:id/lessons`: Mentor/Admin/Member-trong-lớp, sắp theo `order`.
- `GET /lessons/:id`: lấy lesson → lấy `classId` → kiểm tra quyền xem class đó (đây là chỗ hay quên: **route theo lessonId vẫn phải kiểm tra theo class**).
- `PATCH/DELETE /lessons/:id`: lấy lesson → check mentor của `lesson.classId`.
- Quyết định: `order` có cần unique trong class? (gợi ý: có, `@@unique([classId, order])`) .

**Người B – Complete lesson & Progress (Ngày 8–9)**:
- `POST /lessons/:id/complete` (chỉ Member thuộc class của lesson): tạo LessonProgress. Gọi lần 2 → dùng `upsert` hoặc trả 200 idempotent (không báo lỗi, không tạo trùng; unique(lessonId, memberId) bảo vệ).
- `GET /classes/:id/progress`: `totalLessons = count(lesson của class)`; `completed = count(LessonProgress của member trong các lesson của class)`; `progress = total === 0 ? 0 : round(completed/total*100)`. **Chú ý chia cho 0.**

---

### PHASE 5 — ASSIGNMENT & SUBMISSION (Ngày 10–12, B làm)

**Assignments (Ngày 10):** giống Lesson: Mentor-of-class mới được CRUD; Member/Admin xem theo class. Validate: `maximumScore > 0`, `deadline` hợp lệ.

**Submit (Ngày 11):** `POST /assignments/:id/submissions` (Member trong lớp):
1. Lấy assignment → có classId → `isMemberOfClass` else 403.
2. Quyết định về **deadline** (xem Phần 6). Nếu cấm trễ: `now > deadline` → 400/403.
3. Quyết định **nộp lại**: nếu chỉ cho nộp 1 lần → unique(assignmentId, memberId) → trùng thì 409.
4. Validate: có `content` hoặc `repositoryUrl` (ít nhất 1), URL đúng định dạng.
5. `GET /assignments/:id/submissions`: Mentor của lớp → tất cả; Member → chỉ của mình.
6. `GET /submissions/:id`: Mentor của lớp hoặc chính chủ.

**Review (Ngày 12):** `PATCH /submissions/:id/review` body `{score, feedback}`:
1. Lấy submission → assignment → classId → `isMentorOfClass` else 403 (**đây là test "Mentor lớp A không review bài lớp B"**).
2. Validate `0 ≤ score ≤ assignment.maximumScore` (so với DB, nên làm ở service chứ không chỉ Zod).
3. Lưu score, feedback, `reviewedAt = now`.
Member xem lại submission sẽ thấy score & feedback.

---

### PHASE 6 — TEST, DOCKER, DOCS (Ngày 12–14)

**Test (Ngày 11–13):**
- Dùng database test riêng (ví dụ `DATABASE_URL` trỏ DB `lms_test`), chạy `prisma migrate deploy` trước test.
- Dùng Supertest: `request(app).post('/auth/login').send({...})`. Vì vậy `app.ts` tách khỏi `server.ts`.
- Trước mỗi test (`beforeEach`) dọn DB và tạo dữ liệu mẫu (hoặc dùng helper `createUser`, `loginAs`).
- **Danh sách test tối thiểu (đề yêu cầu) — chia người:**
  - A: login đúng/sai (200/401); gọi API khi thiếu token (401); Member gọi API Admin (403); thêm member trùng (409); Member xem class người khác (403/404); validation tạo class sai ngày (400).
  - B: Mentor lớp khác sửa lesson (403); Mentor lớp khác review submission (403); score > max (400); score âm (400); Member complete lesson tính progress đúng; CRUD lesson/assignment chính.

**Dockerfile + compose đầy đủ (A, Ngày 12):**
- `Dockerfile` (multi-stage đơn giản): base `node:20-alpine` → copy package*.json → `npm ci` → copy source → `npx prisma generate` → `npm run build` → CMD chạy migrate rồi start (`npx prisma migrate deploy && node dist/server.js`).
- `docker-compose.yml`: service `db` (có `healthcheck`) + service `backend` (`depends_on: db: condition: service_healthy`, env `DATABASE_URL` trỏ host là **tên service `db`**, không phải localhost).
- Kiểm tra bằng máy sạch: `docker compose down -v && docker compose up --build`, rồi seed và gọi thử API.

**Swagger (B, Ngày 13):** viết `docs/openapi.yaml` (hoặc dùng `swagger-jsdoc`), mount `app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))`. Phải có: mô tả từng endpoint, schema request/response, nút Authorize bằng Bearer token, mã lỗi.

**README (A, Ngày 13):** giới thiệu, tech stack, yêu cầu cài đặt, cách chạy bằng Docker, cách chạy local, lệnh migrate/seed, tài khoản seed (admin@..., mentor@..., member@...), link `/docs`, cách chạy test, cấu trúc thư mục.

**Ngày 14 – Nghiệm thu chéo:** A kiểm thử phần của B và ngược lại bằng checklist 22 mục ở mục 1.4 trên **một máy sạch** (clone repo mới, làm theo README). Ghi lại tất cả lỗi, sửa. Tick từng mục DoD.

---

## PHẦN 6 — GỢI Ý TRẢ LỜI 15 CHALLENGE QUESTIONS

1. Entity: User, Class, ClassMember, Lesson, LessonProgress, Assignment, Submission.
2. Quan hệ: xem mục 2.2.
3. Completion lưu ở bảng **LessonProgress** (mỗi dòng = 1 member hoàn thành 1 lesson).
4. Có — 1 member tham gia nhiều class (nhiều-nhiều qua ClassMember).
5. 1 class có **đúng 1 mentor** (`mentorId` là một cột). Nếu cần nhiều mentor phải đổi thiết kế → ngoài MVP.
6. So sánh `class.mentorId === user.id`.
7. **Gợi ý: chỉ nộp 1 lần** (đơn giản; resubmission là Level 9). Unique(assignmentId, memberId).
8. **Gợi ý: không cho nộp sau deadline** (trả 400). Bạn có thể chọn "cho nộp trễ" nhưng phải ghi rõ trong Business Rules.
9. Không — chỉ review submission thuộc class mình làm mentor.
10. Unique constraint (classId, memberId) + kiểm tra ở service, trả 409.
11. Xóa Class → xóa theo Lesson, Assignment, ClassMember, Submission, LessonProgress (CASCADE). Hoặc chặn xóa nếu class có dữ liệu (RESTRICT) — chọn 1 và ghi rõ.
12. Authentication: **mọi API trừ `/auth/login` (và `/health`, `/docs`)**.
13. Authorization: mọi API ngoài `/auth/*` — theo ma trận mục 2.4.
14. Unique: `User.email`, `(classId,memberId)`, `(lessonId,memberId)`, `(assignmentId,memberId)`, tùy chọn `(classId, order)`.
15. Index: FK (`classId`, `memberId`, `lessonId`, `assignmentId`, `mentorId`), `email`.

---

## PHẦN 7 — LỜI KHUYÊN CHO NGƯỜI MỚI

**Lỗi hay gặp:**
- Quên `await` → trả về Promise rỗng. Dùng `async/await` mọi nơi, bọc controller bằng try/catch hoặc dùng helper `asyncHandler` (Express 4) để lỗi chạy vào errorHandler.
- Trả cả `passwordHash` trong response → luôn dùng `select`.
- Chỉ kiểm tra quyền ở route "chính" mà quên route theo id con (`/lessons/:id`, `/submissions/:id`) → luôn truy ngược về `classId`.
- Dùng `localhost` trong DATABASE_URL khi chạy trong Docker → phải là tên service (`db`).
- Commit file `.env` lên GitHub → dùng `.gitignore` + `.env.example`.
- Param `:id` là string, DB là số/uuid → chọn 1 kiểu ID thống nhất (gợi ý `uuid` hoặc autoincrement Int; chọn Int cho đơn giản).

**Cách học khi bí:**
- Làm từng endpoint nhỏ → chạy → test tay → commit. Đừng viết cả module rồi mới chạy.
- Thứ tự một endpoint: route → validate → service → gọi Prisma → test bằng Postman → viết test tự động.
- Hỏi AI từng bước nhỏ ("viết giúp tôi middleware verify JWT bằng TypeScript") thay vì cả dự án; và **hiểu code** trước khi dán vào, vì lúc bảo vệ sẽ bị hỏi.

**Tài liệu nên đọc nhanh:**
- Express: expressjs.com (Routing, Error handling)
- Prisma: prisma.io/docs (Schema, Relations, Migrate, Seeding)
- Zod: zod.dev
- JWT: jwt.io/introduction
- HTTP status codes: MDN

**Chiến lược nếu thiếu thời gian:** ưu tiên thứ tự — Auth → Class/Member → Lesson/Progress → Assignment/Submission/Review → Docker → Test → Swagger. Có thể rút gọn Swagger (liệt kê các endpoint chính) và test (chỉ những mục tối thiểu đề nêu), nhưng **không bỏ** Phase 1 và Docker.

Chúc hai bạn làm tốt!
