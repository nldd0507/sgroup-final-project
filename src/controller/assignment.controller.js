import { idParamSchema } from "../schema/common.schema.js";
import * as assignmentService from "../service/assignment.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getByClass = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const assignments = await assignmentService.getByClass(req.user, id);
  return sendSuccess(res, 200, "Get assignments successfully", assignments);
});

export const create = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const assignment = await assignmentService.create(req.user, id, req.body);
  return sendSuccess(res, 201, "Create assignments successfully", assignment);
});

export const getById = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const assignment = await assignmentService.getById(req.user, id);
  return sendSuccess(res, 200, "Get assignment successfully", assignment);
});

export const update = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const assignment = await assignmentService.update(req.user, id, req.body);
  return sendSuccess(res, 200, "Update assignment successfully", assignment);
});

export const remove = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await assignmentService.remove(req.user, id);
  return sendSuccess(res, 204, "Remove assignment successfully");
});
