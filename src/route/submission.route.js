import { Router } from "express";
import * as submissionController from "../controller/submission.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema } from "../schema/submission.schema.js";

const submissionRouter = Router();
submissionRouter.use(authenticate);
submissionRouter.get("/:id", submissionController.getById);
submissionRouter.patch("/:id/review", validate(reviewSchema), submissionController.review);
export default submissionRouter;
