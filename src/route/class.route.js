import { Router } from "express";
import * as classController from "../controller/class.controller.js";
import * as lessonController from "../controller/lesson.controller.js";
import * as assignmentController from "../controller/assignment.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { createClassSchema, updateClassSchema } from "../schema/class.schema.js";
import { createLessonSchema } from "../schema/lesson.schema.js";
import { createAssignmentSchema } from "../schema/assignment.schema.js";
import classMemberRouter from "./classMember.route.js";

const classRouter = Router();
const adminOnly = requireRole("ADMIN");

classRouter.use(authenticate);
classRouter.use("/:id/members", classMemberRouter);

// Classes #7-11
classRouter.get("/", classController.getClasses);
classRouter.get("/:id", classController.getClassById);
classRouter.post("/", adminOnly, validate(createClassSchema), classController.createClass);
classRouter.patch("/:id", adminOnly, validate(updateClassSchema), classController.updateClass);
classRouter.delete("/:id", adminOnly, classController.deleteClass);

// Lessons #15, #17 và progress #21
classRouter.get("/:id/lessons", lessonController.getByClass);
classRouter.post("/:id/lessons", validate(createLessonSchema), lessonController.create);
classRouter.get("/:id/progress", lessonController.getProgress);

// Assignments #22, #24
classRouter.get("/:id/assignments", assignmentController.getByClass);
classRouter.post("/:id/assignments", validate(createAssignmentSchema), assignmentController.create);

export default classRouter;
