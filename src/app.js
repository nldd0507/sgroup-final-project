import express from "express";
import router from "./route/route.js";
import errorHandler from "./middleware/errorHandler.js";
import { NotFoundError } from "./core/error.response.js";
import authRouter from "./route/auth.route.js";

const app = express();

app.use(express.json());
app.use("/", router);

app.use((req, res, next) => next(new NotFoundError("Route không tồn tại")));
app.use(errorHandler);

export default app;
