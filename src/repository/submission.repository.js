import prisma from "../config/prisma.config.js";

const submission_fields = {
  id: true,
  assignment_id: true,
  member_id: true,
  content: true,
  repository_url: true,
  submitted_at: true,
  score: true,
  feedback: true,
  reviewed_at: true,
};

export const findOne = (assignmentId, memberId) =>
  prisma.submissions.findUnique({
    where: {
      assignment_id_member_id: {
        assignment_id: Number(assignmentId),
        member_id: Number(memberId),
      },
    },
    select: { id: true },
  });

// Có memberId: chỉ bài của người đó (member xem). Không có: cả lớp (mentor xem)
export const findByAssignment = (assignmentId, memberId) =>
  prisma.submissions.findMany({
    where: {
      assignment_id: Number(assignmentId),
      ...(memberId && { member_id: Number(memberId) }),
    },
    select: submission_fields,
    orderBy: { submitted_at: "asc" },
  });

// Kèm assignment để lần ra class_id và maximum_score
export const findById = (id) =>
  prisma.submissions.findUnique({
    where: { id: Number(id) },
    select: {
      ...submission_fields,
      assignments: { select: { class_id: true, maximum_score: true } },
    },
  });

export const create = (data) => prisma.submissions.create({ data, select: submission_fields });

export const update = (id, data) =>
  prisma.submissions.update({ where: { id: Number(id) }, data, select: submission_fields });
