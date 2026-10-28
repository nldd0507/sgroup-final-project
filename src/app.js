import express from "express";
import router from "./route/health.route.js";
import errorHandler from "./middleware/errorHandler.js"
import { NotFoundError } from "./core/error.response.js";

const app = express();

app.use(express.json());
app.use("/", router);

app.use((res, req, next) => next(new NotFoundError("Route không tồn tại")));
app.use("/health", router);
app.use(errorHandler);

export default app;