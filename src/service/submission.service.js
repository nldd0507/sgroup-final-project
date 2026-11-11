import { submissionRepository } from '../repository/submission.repository.js';
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

export const submitAssignment = async (assignmentId, data, user) => {
  const currentUserId = extractUserId(user);
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  // 1. User phải là Member chính thức của Class chứa Assignment đó
  const isMember = await classRepository.isMemberOfClass(assignment.class_id, currentUserId);
  if (!isMember) {
    throw new ForbiddenError('You are not a member of this class');
  }

  // 2. Deadline check: now <= deadline, nếu quá hạn trả về 400 Bad Request
  if (new Date() > new Date(assignment.deadline)) {
    throw new BadRequestError('Assignment deadline has passed');
  }

  // 3. Cơ chế Level 7: Upsert in-place
  return submissionRepository.upsertSubmission(assignmentId, currentUserId, data);
};

export const getSubmissionsByAssignment = async (assignmentId, user) => {
  const currentUserId = extractUserId(user);
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  const isMentor = Number(assignment.classes.mentor_id) === currentUserId;
  const isAdmin = user?.role === 'ADMIN';

  if (!isMentor && !isAdmin) {
    throw new ForbiddenError('Only the class mentor can view all submissions');
  }

  return submissionRepository.findSubmissionsByAssignment(assignmentId);
};

export const getSubmissionById = async (submissionId, user) => {
  const currentUserId = extractUserId(user);
  const submission = await submissionRepository.findById(submissionId);
  if (!submission) throw new NotFoundError('Submission not found');

  const mentorId = Number(submission.assignments.classes.mentor_id);
  const isMentor = mentorId === currentUserId;
  const isOwner = Number(submission.member_id) === currentUserId;
  const isAdmin = user?.role === 'ADMIN';

  if (!isMentor && !isOwner && !isAdmin) {
    throw new ForbiddenError('Access denied to this submission');
  }

  return submission;
};

export const reviewSubmission = async (submissionId, { score, feedback }, user) => {
  const currentUserId = extractUserId(user);
  const submission = await submissionRepository.findById(submissionId);
  if (!submission) throw new NotFoundError('Submission not found');

  const mentorId = Number(submission.assignments.classes.mentor_id);
  const isMentor = mentorId === currentUserId;

  if (!isMentor) {
    throw new ForbiddenError('You are not authorized to review submissions for this class');
  }

  const maxScore = Number(submission.assignments.maximum_score);
  if (score < 0 || score > maxScore) {
    throw new BadRequestError(`Score must be between 0 and ${maxScore}`);
  }

  return submissionRepository.updateReview(submissionId, score, feedback);
};