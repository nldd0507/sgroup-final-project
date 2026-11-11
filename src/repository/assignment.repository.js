import prisma from '../config/prisma.config.js';

export const assignmentRepository = {
  async create(classId, data) {
    return prisma.assignments.create({
      data: {
        class_id: Number(classId),
        title: data.title,
        description: data.description ?? null,
        maximum_score: Number(data.maximumScore),
        deadline: new Date(data.deadline),
      },
    });
  },

  async findById(assignmentId) {
    return prisma.assignments.findUnique({
      where: { id: Number(assignmentId) },
      include: {
        classes: true,
      },
    });
  },

  async findAllByClassId(classId) {
    return prisma.assignments.findMany({
      where: { class_id: Number(classId) },
      orderBy: { deadline: 'asc' },
    });
  },

  async update(assignmentId, data) {
    return prisma.assignments.update({
      where: { id: Number(assignmentId) },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.maximumScore !== undefined && { maximum_score: Number(data.maximumScore) }),
        ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
      },
    });
  },

  async delete(assignmentId) {
    return prisma.assignments.delete({
      where: { id: Number(assignmentId) },
    });
  },
};