import { Router } from "express";
import healthRouter from "./health.route.js";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";
import classRouter from "./class.route.js";
import lessonRouter from "./lesson.route.js";
import assignmentRouter from "./assignment.route.js";
const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/classes", classRouter);
router.use("/lessons", lessonRouter);
router.use("/assignments", assignmentRouter);

export default router;
