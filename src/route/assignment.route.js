import { Router } from "express";
import * as assignmentController from "../controller/assignment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateAssignmentSchema } from "../schema/assignment.schema.js";

const assignmentRouter = Router();
assignmentRouter.use(authenticate);
assignmentRouter.get("/:id", assignmentController.getById);
assignmentRouter.patch("/:id", validate(updateAssignmentSchema), assignmentController.update);
assignmentRouter.delete("/:id", assignmentController.remove);
export default assignmentRouter;
