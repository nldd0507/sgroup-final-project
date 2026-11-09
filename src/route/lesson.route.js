import { Router } from "express";
import { lessonController } from "../controller/lesson.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate, updateLessonSchema } from "../middleware/validate.js";

const Lessonrouter = Router();

Lessonrouter.use(authenticate);

Lessonrouter.get("/:id", lessonController.getLessonById);
Lessonrouter.patch("/:id", validate(updateLessonSchema), lessonController.updateLesson);
Lessonrouter.delete("/:id", lessonController.deleteLesson);
Lessonrouter.post("/:id/complete", lessonController.completeLesson);

export default Lessonrouter;