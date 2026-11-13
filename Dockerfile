# ---------- Bước 1: build giao diện web (React + Vite) ra file tĩnh ----------
FROM node:22-bookworm-slim AS web

WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---------- Bước 2: image chạy backend, kèm giao diện đã build ----------
FROM node:22-bookworm-slim

# Prisma cần openssl, image slim không có sẵn
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy file khai báo thư viện trước để Docker cache bước npm ci
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate

# Chỉ lấy thư mục dist từ bước 1; node_modules của React không vào image cuối
COPY --from=web /web/dist ./web/dist

EXPOSE 3000

# Chạy migration (bỏ qua file đã chạy) rồi mới start server
CMD ["sh", "-c", "node db/migrate.js && node src/index.js"]
