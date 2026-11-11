import prisma from '../config/prisma.config.js';

export const submissionRepository = {
  async findByAssignmentAndMember(assignmentId, memberId) {
    return prisma.submissions.findUnique({
      where: {
        assignment_id_member_id: {
          assignment_id: Number(assignmentId),
          member_id: Number(memberId),
        },
      },
    });
  },

  async upsertSubmission(assignmentId, memberId, data) {
    return prisma.submissions.upsert({
      where: {
        assignment_id_member_id: {
          assignment_id: Number(assignmentId),
          member_id: Number(memberId),
        },
      },
      // Nộp lại trước deadline: Update in-place, làm mới submitted_at, reset review
      update: {
        content: data.content ?? null,
        repository_url: data.repositoryUrl ?? null,
        submitted_at: new Date(),
        score: null,
        feedback: null,
        reviewed_at: null,
      },
      // Nộp lần đầu: INSERT bản ghi mới
      create: {
        assignment_id: Number(assignmentId),
        member_id: Number(memberId),
        content: data.content ?? null,
        repository_url: data.repositoryUrl ?? null,
        submitted_at: new Date(),
      },
    });
  },

  async findSubmissionsByAssignment(assignmentId) {
    return prisma.submissions.findMany({
      where: { assignment_id: Number(assignmentId) },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });
  },

  async findById(submissionId) {
    return prisma.submissions.findUnique({
      where: { id: Number(submissionId) },
      include: {
        assignments: {
          include: { classes: true },
        },
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async updateReview(submissionId, score, feedback) {
    return prisma.submissions.update({
      where: { id: Number(submissionId) },
      data: {
        score: Number(score),
        feedback: feedback ?? null,
        reviewed_at: new Date(),
      },
    });
  },
};