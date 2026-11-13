import { Router } from "express";
import * as lessonController from "../controller/lesson.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateLessonSchema } from "../schema/lesson.schema.js";

const lessonRouter = Router();
lessonRouter.use(authenticate);
lessonRouter.get("/:id", lessonController.getById);
lessonRouter.patch("/:id", validate(updateLessonSchema), lessonController.update);
lessonRouter.delete("/:id", lessonController.remove);
lessonRouter.post("/:id/complete", lessonController.complete);
export default lessonRouter;
