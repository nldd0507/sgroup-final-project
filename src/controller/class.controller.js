import { idParamSchema } from "../schema/common.schema.js";
import * as classService from "../service/class.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getClasses = catchAsync(async (req, res) => {
  const classes = await classService.getClasses(req.user);
  return sendSuccess(res, 200, "Get classes successfully", classes);
});

export const getClassById = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const classItem = await classService.getClassById(req.user, id);
  return sendSuccess(res, 200, "Get class successfully", classItem);
});

export const createClass = catchAsync(async (req, res) => {
  const classItem = await classService.createClass(req.body);
  return sendSuccess(res, 201, "Class created successfully", classItem);
});

export const updateClass = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const classItem = await classService.updateClass(id, req.body);
  return sendSuccess(res, 200, "Class updated successfully", classItem);
});

export const deleteClass = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await classService.deleteClass(id);
  return res.status(204).end();
});
