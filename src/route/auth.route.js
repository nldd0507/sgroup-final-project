import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { validate, loginSchema } from "../middleware/validate.js";
import { authenticate} from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.get("/me", authenticate, authController.getMe);

export default authRouter;

