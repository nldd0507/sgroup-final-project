import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import { lessonController } from "../controller/lesson.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { createClassSchema, updateClassSchema } from "../schema/class.schema.js";
import { validate, createLessonSchema } from "../middleware/validate.js";
import classMemberRouter from "./classMember.route.js";

const classRouter = Router();

classRouter.use(authenticate);
classRouter.use("/:id/members", classMemberRouter);
const adminOnly = requireRole("ADMIN");

classRouter.get("/", classController.getClasses);
classRouter.get("/:id", classController.getClassById);
classRouter.post("/", adminOnly, validate(createClassSchema), classController.createClass);
classRouter.patch("/:id", adminOnly, validate(updateClassSchema), classController.updateClass);
classRouter.delete("/:id", adminOnly, classController.deleteClass);
classRouter.post(
  "/:id/lessons",
  authenticate,
  validate(createLessonSchema),
  lessonController.createLesson
);
classRouter.get("/:id/lessons", authenticate, lessonController.getLessonsByClass);
classRouter.get("/:id/progress", authenticate, lessonController.getClassProgress);

export default classRouter;
