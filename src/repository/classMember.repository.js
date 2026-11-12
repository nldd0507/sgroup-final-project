import prisma from "../config/prisma.config.js";

export const findByClass = (classId) => {
  return prisma.class_members.findMany({
    where: { class_id: Number(classId) },
    select: {
      member_id: true,
      joined_at: true,
      users: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { joined_at: "asc" },
  });
};

export const create = (classId, memberId) => {
  return prisma.class_members.create({
    data: { class_id: Number(classId), member_id: Number(memberId) },
  });
};

export const remove = (classId, memberId) =>
  prisma.class_members.delete({
    where: { class_id_member_id: { class_id: Number(classId), member_id: Number(memberId) } },
  });
