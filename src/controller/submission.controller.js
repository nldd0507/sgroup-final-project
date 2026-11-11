import * as submissionService from '../service/submission.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const submitAssignment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await submissionService.submitAssignment(id, req.body, req.user);
  return sendSuccess(res, 200, 'Assignment submitted successfully!', result);
});

export const getSubmissionsByAssignment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await submissionService.getSubmissionsByAssignment(id, req.user);
  return sendSuccess(res, 200, 'Get submissions successfully!', result);
});

export const getSubmissionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await submissionService.getSubmissionById(id, req.user);
  return sendSuccess(res, 200, 'Get submission details successfully!', result);
});

export const reviewSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await submissionService.reviewSubmission(id, req.body, req.user);
  return sendSuccess(res, 200, 'Submission reviewed successfully!', result);
});