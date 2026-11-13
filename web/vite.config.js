import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Các đường dẫn API của backend. Khi chạy `npm run dev`, Vite chuyển tiếp chúng sang backend
// nên trình duyệt chỉ nói chuyện với một địa chỉ (không cần CORS), giống hệt lúc deploy.
const API_PREFIXES = ["/auth", "/users", "/classes", "/lessons", "/assignments", "/submissions", "/health"];
const API_URL = process.env.API_URL || "http://localhost:3000";

export default defineConfig({
  // Express phục vụ giao diện ở /app (API đã dùng /classes, /users... ở gốc)
  base: "/app/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(API_PREFIXES.map((prefix) => [prefix, API_URL])),
  },
});
