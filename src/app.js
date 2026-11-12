import fs from "node:fs";
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
app.use("/", router);

app.use((req, res, next) => next(new NotFoundError("Route không tồn tại")));
app.use(errorHandler);

export default app;
