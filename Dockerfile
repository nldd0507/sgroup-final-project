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

EXPOSE 3000

# Chạy migration (bỏ qua file đã chạy) rồi mới start server
CMD ["sh", "-c", "node db/migrate.js && node src/index.js"]