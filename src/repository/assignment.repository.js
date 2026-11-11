import prisma from "../config/prisma.config.js";

const assignment_fields = {
  id: true,
  class_id: true,
  title: true,
  description: true,
  deadline: true,
  maximum_score: true,
};

export const findByClass = (classId) => {
  return prisma.assignments.findMany({
    where: { class_id: Number(classId) },
    select: assignment_fields,
    orderBy: { deadline: "asc" },
  });
};

export const findById = (id) => {
  return prisma.assignments.findUnique({ where: { id: Number(id) }, select: assignment_fields });
};

export const create = (data) => prisma.assignments.create({ data, select: assignment_fields });

export const update = (id, data) =>
  prisma.assignments.update({ where: { id: Number(id) }, data, select: assignment_fields });

export const remove = (id) => prisma.assignments.delete({ where: { id: Number(id) } });
