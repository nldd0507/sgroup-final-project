import { Router } from 'express';
import * as assignmentController from '../controller/assignment.controller.js';
import * as submissionController from '../controller/submission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  updateAssignmentSchema,
  submitAssignmentSchema,
} from '../schema/assignment.schema.js';

const assignmentRouter = Router();
assignmentRouter.use(authenticate);

assignmentRouter.get('/:id', assignmentController.getAssignmentById);
assignmentRouter.patch('/:id', validate(updateAssignmentSchema), assignmentController.updateAssignment);
assignmentRouter.delete('/:id', assignmentController.deleteAssignment);
assignmentRouter.post('/:id/submissions', validate(submitAssignmentSchema), submissionController.submitAssignment);
assignmentRouter.get('/:id/submissions', submissionController.getSubmissionsByAssignment);

export default assignmentRouter;