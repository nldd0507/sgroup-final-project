import * as submissionRepository from "../repository/submission.repository.js";
import { findAssignmentOrNotFound } from "./assignment.service.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { assertMemberOfClass, assertMentorOfClass, isMentorOfClass } from "../utils/permission.js";

export const toSubmissionResponse = (s) => ({
  id: s.id,
  assignmentId: s.assignment_id,
  memberId: s.member_id,
  content: s.content,
  repositoryUrl: s.repository_url,
  submittedAt: s.submitted_at,
  score: s.score,
  feedback: s.feedback,
  reviewedAt: s.reviewed_at,
});

const findSubmissionOrNotFound = async (id) => {
  const s = await submissionRepository.findById(id);
  if (!s) throw new NotFoundError("Submission not found");
  return s;
};

// Thứ tự: 404 assignment -> 403 quyền -> 400 deadline -> 409 trùng
export const submit = async (user, assignmentId, { content, repositoryUrl }) => {
  const a = await findAssignmentOrNotFound(assignmentId);
  await assertMemberOfClass(user, a.class_id); // BR-21
  if (new Date() > a.deadline) throw new BadRequestError("Deadline has passed"); // BR-23
  if (await submissionRepository.findOne(assignmentId, user.sub)) {
    throw new ConflictError("You have already submitted this assignment"); // BR-22
  }
  const s = await submissionRepository.create({
    assignment_id: Number(assignmentId),
    member_id: Number(user.sub),
    content: content ?? null,
    repository_url: repositoryUrl ?? null,
  });
  return toSubmissionResponse(s);
};

// Mentor: cả lớp. Member: chỉ bài của mình. Admin, người ngoài lớp: 403 (BR-25)
export const listForAssignment = async (user, assignmentId) => {
  const a = await findAssignmentOrNotFound(assignmentId);
  if (await isMentorOfClass(user.sub, a.class_id)) {
    return (await submissionRepository.findByAssignment(assignmentId)).map(toSubmissionResponse);
  }
  await assertMemberOfClass(user, a.class_id);
  return (await submissionRepository.findByAssignment(assignmentId, user.sub)).map(
    toSubmissionResponse
  );
};

// Chính chủ hoặc mentor của lớp (BR-25)
export const getById = async (user, id) => {
  const s = await findSubmissionOrNotFound(id);
  const isOwner = s.member_id === Number(user.sub);
  if (isOwner || (await isMentorOfClass(user.sub, s.assignments.class_id))) {
    return toSubmissionResponse(s);
  }
  throw new ForbiddenError("You do not have permission to view this submission");
};

export const review = async (user, id, { score, feedback }) => {
  const s = await findSubmissionOrNotFound(id);
  await assertMentorOfClass(user, s.assignments.class_id); // BR-25, BR-28
  const max = s.assignments.maximum_score;
  if (score > max) throw new BadRequestError(`Score must be between 0 and ${max}`); // BR-26
  const updated = await submissionRepository.update(id, {
    score,
    feedback: feedback ?? null,
    reviewed_at: new Date(), // BR-27
  });
  return toSubmissionResponse(updated);
};
