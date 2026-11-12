import { Router } from "express";
import * as assignmentController from "../controller/assignment.controller.js";
import * as submissionController from "../controller/submission.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { updateAssignmentSchema } from "../schema/assignment.schema.js";
import { createSubmissionSchema } from "../schema/submission.schema.js";

const assignmentRouter = Router();
assignmentRouter.use(authenticate);
assignmentRouter.get("/:id", assignmentController.getById);
assignmentRouter.patch("/:id", validate(updateAssignmentSchema), assignmentController.update);
assignmentRouter.delete("/:id", assignmentController.remove);
assignmentRouter.post(
  "/:id/submissions",
  validate(createSubmissionSchema),
  submissionController.submit
);
assignmentRouter.get("/:id/submissions", submissionController.listForAssignment);
export default assignmentRouter;
