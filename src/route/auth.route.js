import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { validate, loginSchema, registerSchema, refreshTokenRules } from "../middleware/validate.js";
import { authenticate} from "../middleware/auth.middleware.js";


const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh-token",validate(refreshTokenRules), authController.refreshToken);
authRouter.get("/me", authenticate, authController.getMe);
authRouter.post("/logout", authenticate, authController.logout);

export default authRouter;

