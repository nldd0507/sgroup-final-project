# sgroup-final-project

Yêu cầu: Node.js 20+, Docker Desktop.

## Chạy local

1. Sao chép `.env.example` thành `.env` (giá trị mặc định đã khớp với `docker-compose.yml`)
2. `docker compose up -d db`
3. `npm install`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev` → http://localhost:3000/health

Tài khoản seed (mật khẩu `Password123!`): `admin@sgroup.com`, `mentor@sgroup.com`, `member@sgroup.com`.

> Nếu đổi qua lại giữa Windows và WSL mà gặp lỗi `Prisma Client could not locate the Query Engine`, chạy lại `npx prisma generate` trong môi trường đang dùng.

## Tài liệu

Xem thư mục `docs/`.
