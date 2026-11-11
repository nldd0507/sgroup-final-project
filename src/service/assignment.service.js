import { assignmentRepository } from '../repository/assignment.repository.js';
import { classRepository } from '../repository/class.repository.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../core/error.response.js';

const extractUserId = (user) => {
  const rawId = user?.sub || user?.id;
  if (!rawId) throw new ForbiddenError('Invalid user token identity');
  return Number(rawId);
};

export const createAssignment = async (classId, data, user) => {
  const currentUserId = extractUserId(user);
  const cls = await classRepository.findById(classId);
  if (!cls) throw new NotFoundError('Class not found');

  const isAdmin = user?.role === 'ADMIN';
  const isMentor = Number(cls.mentor_id) === currentUserId;
  if (!isAdmin && !isMentor) {
    throw new ForbiddenError('Only the mentor of this class can create assignments');
  }

  if (new Date(data.deadline) <= new Date()) {
    throw new BadRequestError('Deadline must be in the future');
  }

  return assignmentRepository.create(classId, data);
};

export const getAssignmentsByClass = async (classId, user) => {
  const currentUserId = extractUserId(user);
  const cls = await classRepository.findById(classId);
  if (!cls) throw new NotFoundError('Class not found');

  const isAdmin = user?.role === 'ADMIN';
  const isMentor = Number(cls.mentor_id) === currentUserId;
  const isMember = await classRepository.isMemberOfClass(classId, currentUserId);

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError('You are not authorized to view assignments for this class');
  }

  return assignmentRepository.findAllByClassId(classId);
};

export const getAssignmentById = async (assignmentId, user) => {
  const currentUserId = extractUserId(user);
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  const cls = assignment.classes;
  const isAdmin = user?.role === 'ADMIN';
  const isMentor = Number(cls.mentor_id) === currentUserId;
  const isMember = await classRepository.isMemberOfClass(assignment.class_id, currentUserId);

  if (!isAdmin && !isMentor && !isMember) {
    throw new ForbiddenError('Access denied to this assignment');
  }

  return assignment;
};

export const updateAssignment = async (assignmentId, data, user) => {
  const currentUserId = extractUserId(user);
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  const isAdmin = user?.role === 'ADMIN';
  const isMentor = Number(assignment.classes.mentor_id) === currentUserId;
  if (!isAdmin && !isMentor) {
    throw new ForbiddenError('Only the mentor of this class can update assignments');
  }

  if (data.deadline && new Date(data.deadline) <= new Date()) {
    throw new BadRequestError('Deadline must be in the future');
  }

  return assignmentRepository.update(assignmentId, data);
};

export const deleteAssignment = async (assignmentId, user) => {
  const currentUserId = extractUserId(user);
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  const isAdmin = user?.role === 'ADMIN';
  const isMentor = Number(assignment.classes.mentor_id) === currentUserId;
  if (!isAdmin && !isMentor) {
    throw new ForbiddenError('Only the mentor of this class can delete assignments');
  }

  return assignmentRepository.delete(assignmentId);
};