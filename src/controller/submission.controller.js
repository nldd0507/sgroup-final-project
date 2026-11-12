import { idParamSchema } from "../schema/common.schema.js";
import * as submissionService from "../service/submission.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const submit = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const submission = await submissionService.submit(req.user, id, req.body);
  return sendSuccess(res, 201, "Submitted successfully", submission);
});

export const listForAssignment = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const submissions = await submissionService.listForAssignment(req.user, id);
  return sendSuccess(res, 200, "Get submissions successfully", submissions);
});

export const getById = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const submission = await submissionService.getById(req.user, id);
  return sendSuccess(res, 200, "Get submission successfully", submission);
});

export const review = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const submission = await submissionService.review(req.user, id, req.body);
  return sendSuccess(res, 200, "Submission reviewed successfully", submission);
});
