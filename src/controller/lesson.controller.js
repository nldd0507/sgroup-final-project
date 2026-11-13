import { idParamSchema } from "../schema/common.schema.js";
import * as lessonService from "../service/lesson.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getByClass = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const lessons = await lessonService.getByClass(req.user, id);
  return sendSuccess(res, 200, "Get lessons successfully", lessons);
});

export const getById = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const lesson = await lessonService.getById(req.user, id);
  return sendSuccess(res, 200, "Get lesson successfully", lesson);
});

export const create = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const lesson = await lessonService.create(req.user, id, req.body);
  return sendSuccess(res, 201, "Lesson created successfully", lesson);
});

export const update = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const lesson = await lessonService.update(req.user, id, req.body);
  return sendSuccess(res, 200, "Lesson updated successfully", lesson);
});

export const remove = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await lessonService.remove(req.user, id);
  return sendSuccess(res, 204);
});

export const complete = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const progress = await lessonService.complete(req.user, id);
  return sendSuccess(res, 200, "Lesson marked as completed", progress);
});

export const getProgress = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const progress = await lessonService.getProgress(req.user, id);
  return sendSuccess(res, 200, "Get progress successfully", progress);
});
