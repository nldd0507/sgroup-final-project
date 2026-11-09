import { lessonService } from "../service/lesson.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const lessonController = {
  createLesson: catchAsync(async (req, res) => {
    const lesson = await lessonService.createLesson(req.params.id, req.body, req.user);
    sendSuccess(res, 201, "Lesson created successfully", lesson);
  }),

  getLessonsByClass: catchAsync(async (req, res) => {
    const lessons = await lessonService.getLessonsByClass(req.params.id, req.user);
    sendSuccess(res, 200, "Get lessons successfully", lessons);
  }),

  getLessonById: catchAsync(async (req, res) => {
    const lesson = await lessonService.getLessonById(req.params.id, req.user);
    sendSuccess(res, 200, "Get lesson detail successfully", lesson);
  }),

  updateLesson: catchAsync(async (req, res) => {
    const lesson = await lessonService.updateLesson(req.params.id, req.body, req.user);
    sendSuccess(res, 200, "Lesson updated successfully", lesson);
  }),

  deleteLesson: catchAsync(async (req, res) => {
    await lessonService.deleteLesson(req.params.id, req.user);
    sendSuccess(res, 204);
  }),

  completeLesson: catchAsync(async (req, res) => {
    const progress = await lessonService.completeLesson(req.params.id, req.user);
    sendSuccess(res, 200, "Lesson marked as completed", progress);
  }),

  getClassProgress: catchAsync(async (req, res) => {
    const progress = await lessonService.getClassProgress(req.params.id, req.user);
    sendSuccess(res, 200, "Get progress successfully", progress);
  }),
};