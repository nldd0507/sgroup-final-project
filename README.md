# sgroup-final-project

Yêu cầu: Node.js 20+, Docker Desktop.

## Chạy local

1. Sao chép `.env.example` thành `.env` (giá trị mặc định đã khớp với `docker-compose.yml`)
2. `docker compose up -d db`
3. `npm install`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev` → http://localhost:3000/health

Tài khoản đăng nhập: xem mục [Seed dữ liệu mẫu](#seed-dữ-liệu-mẫu).

> Nếu đổi qua lại giữa Windows và WSL mà gặp lỗi `Prisma Client could not locate the Query Engine`, chạy lại `npx prisma generate` trong môi trường đang dùng.

## Seed dữ liệu mẫu

Seed tạo sẵn user, class, lesson, tiến độ học, assignment và bài nộp để test API (code ở `prisma/seed.js`).

### Cách chạy

Điều kiện: DB đang chạy, đã migrate, và `.env` có `DATABASE_URL`.

```bash
docker compose up -d db
npm run db:migrate
npm run db:seed
```

Chạy lại bao nhiêu lần cũng được: seed **không tạo trùng**, và đưa dữ liệu mẫu về đúng trạng thái ban đầu (kể cả password, tên, role của các tài khoản seed). Sau khi test làm "bẩn" dữ liệu, chỉ cần chạy lại `npm run db:seed`.

Muốn **xóa sạch DB** rồi tạo lại từ đầu (mất toàn bộ dữ liệu):

```bash
docker compose down -v
docker compose up -d db
npm run db:migrate
npm run db:seed
```

### Tài khoản

Mật khẩu chung: `Password123!`

| Email | Role | Dùng để test |
|---|---|---|
| `admin@sgroup.com`, `admin2@sgroup.com` | ADMIN | Quản lý user, class, member |
| `mentor@sgroup.com` | MEMBER | Mentor lớp BE 01 và BE 00 |
| `mentor2@sgroup.com` | MEMBER | Mentor lớp FE 01, **đồng thời là học viên** BE 01 |
| `mentor3@sgroup.com` | MEMBER | Mentor lớp DevOps 01 (lớp chưa có lesson) |
| `member@sgroup.com` | MEMBER | Học 2 lớp: BE 01 và FE 01 |
| `member2` … `member7@sgroup.com` | MEMBER | Học viên các lớp |
| `member8@sgroup.com` | MEMBER | Không thuộc lớp nào → test 403 |

> Mentor không phải là role. Một user là mentor của lớp khi `classes.mentor_id` trỏ tới user đó.

### Dữ liệu lớp học

| Lớp | Trạng thái | Lesson | Tiến độ học viên |
|---|---|---|---|
| BE Basic - Batch 01 | Đang học | 5 | member 100%, member4 60%, member2 40%, mentor2 20%, member3 0% |
| FE Basic - Batch 01 | Vừa khai giảng | 3 | member5 100%, member 33%, member6 0% |
| DevOps Intro - Batch 01 | Chưa khai giảng | 0 | member7 → progress phải là 0 |
| BE Basic - Batch 00 | Đã kết thúc | 2 | member6 100% |

Assignment và bài nộp (deadline tính theo thời điểm chạy seed):

| Lớp | Assignment | Deadline | Bài nộp |
|---|---|---|---|
| BE 01 | HTTP & REST API | **đã quá hạn** 3 ngày | member (đã chấm), member2 (chưa chấm); member3, member4 chưa nộp |
| BE 01 | Express CRUD | còn 7 ngày | member4 (chỉ link repo) |
| BE 01 | Auth với JWT | còn 21 ngày | chưa ai nộp |
| FE 01 | Responsive Landing Page | còn 10 ngày | member5 (chỉ link repo, đã chấm) |
| BE 00 | Final Project | đã quá hạn | member6 (đã chấm) |

### Gặp lỗi khi seed?

| Lỗi | Cách sửa |
|---|---|
| `Environment variable not found: DATABASE_URL` | Thêm `DATABASE_URL` vào `.env` (xem `.env.example`) |
| `Can't reach database server at localhost:5433` | Mở Docker Desktop, chạy `docker compose up -d db` |
| `password authentication failed` | Mật khẩu trong `.env` (`DB_PASSWORD`, `DATABASE_URL`) phải khớp với DB (mặc định `sgroup`) |
| `The column ... does not exist` / `relation ... does not exist` | Chưa migrate: chạy `npm run db:migrate` |

## Tài liệu

Xem thư mục `docs/`.
