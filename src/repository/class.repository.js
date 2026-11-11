import prisma from "../config/prisma.config.js";

const class_fields = {
  id: true,
  name: true,
  description: true,
  start_date: true,
  end_date: true,
  mentor_id: true,
};

export const findAll = () =>
  prisma.classes.findMany({
    select: class_fields,
    orderBy: { id: "asc" },
  });

// BR-13: lớp mình làm mentor HOẶC lớp mình là member
export const findVisibleTo = (userId) =>
  prisma.classes.findMany({
    where: {
      OR: [{ mentor_id: userId }, { class_members: { some: { member_id: userId } } }],
    },
    select: class_fields,
    orderBy: { id: "asc" },
  });

export const findById = (id) =>
  prisma.classes.findUnique({
    where: { id: Number(id) },
    select: { ...class_fields, users: { select: { id: true, name: true } } },
  });

export const create = (data) => prisma.classes.create({ data, select: class_fields });
export const update = (id, data) =>
  prisma.classes.update({ where: { id: Number(id) }, data, select: class_fields });
export const remove = (id) => prisma.classes.delete({ where: { id: Number(id) } });

export const classRepository = {
  findAll,
  findVisibleTo,
  findById,
  create,
  update,
  remove,
};

export default classRepository;