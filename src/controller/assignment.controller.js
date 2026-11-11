import * as assignmentService from '../service/assignment.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const createAssignment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await assignmentService.createAssignment(id, req.body, req.user);
  return sendSuccess(res, 201, 'Assignment created successfully!', result);
});

export const getAssignmentsByClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await assignmentService.getAssignmentsByClass(id, req.user);
  return sendSuccess(res, 200, 'Get assignments by class successfully!', result);
});

export const getAssignmentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await assignmentService.getAssignmentById(id, req.user);
  return sendSuccess(res, 200, 'Get assignment details successfully!', result);
});

export const updateAssignment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await assignmentService.updateAssignment(id, req.body, req.user);
  return sendSuccess(res, 200, 'Assignment updated successfully!', result);
});

export const deleteAssignment = catchAsync(async (req, res) => {
  const { id } = req.params;
  await assignmentService.deleteAssignment(id, req.user);
  return sendSuccess(res, 204, 'Assignment deleted successfully!');
});