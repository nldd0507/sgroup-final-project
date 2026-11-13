import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import router from "./route/route.js";
import errorHandler from "./middleware/errorHandler.js";
import { NotFoundError } from "./core/error.response.js";

const openapi = YAML.parse(
  fs.readFileSync(new URL("../docs/openapi.yaml", import.meta.url), "utf8")
);

const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// Giao diện web (thư mục web/, build ra web/dist). API đã dùng /classes, /users... ở gốc,
// nên giao diện nằm ở /app để F5 trên /app/classes/1 không gọi nhầm vào API.
const webDist = fileURLToPath(new URL("../web/dist", import.meta.url));
if (fs.existsSync(path.join(webDist, "index.html"))) {
  // File trong assets/ có mã hash trong tên, đổi nội dung là đổi tên: cho trình duyệt cache lâu
  app.use("/app/assets", express.static(path.join(webDist, "assets"), { immutable: true, maxAge: "1y" }));
  app.use("/app", express.static(webDist, { index: false, redirect: false }));
  // Mọi đường dẫn khác dưới /app trả index.html, React Router tự hiển thị đúng trang
  app.get(["/app", "/app/{*rest}"], (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(webDist, "index.html"));
  });
  app.get("/", (req, res) => res.redirect("/app/"));
}

app.use("/", router);

app.use((req, res, next) => next(new NotFoundError("Route không tồn tại")));
app.use(errorHandler);

export default app;
