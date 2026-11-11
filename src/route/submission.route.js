import { Router } from 'express';
import * as submissionController from '../controller/submission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { reviewSubmissionSchema } from '../schema/assignment.schema.js';

const submissionRouter = Router();
submissionRouter.use(authenticate);

submissionRouter.get('/:id', submissionController.getSubmissionById);
submissionRouter.patch('/:id/review', validate(reviewSubmissionSchema), submissionController.reviewSubmission);

export default submissionRouter;