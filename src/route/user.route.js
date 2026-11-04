import { Router } from "express";
import * as userController from "../controller/user.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { createUserSchema, updateUserSchema } from "../schema/user.schema.js";
import { validate } from "../middleware/validate.js";

const userRouter = Router();

userRouter.use(authenticate, requireRole("ADMIN"));

userRouter.post("/", validate(createUserSchema), userController.createUser);

userRouter.get("/", userController.getUsers);
userRouter.get("/:id", userController.getUserById);
userRouter.patch("/:id", validate(updateUserSchema), userController.updateUser);

export default userRouter;
