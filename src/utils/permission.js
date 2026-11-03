import prisma from "../config/prisma.config.js";
import { ForbiddenError, NotFoundError } from "../core/error.response.js";

export const isMentorOfClass = async (userId, classId) => {
  const classItem = await prisma.classes.findUnique({
    where: { id: Number(classId) },
    select: { mentor_id: true },
  });

  if (!classItem) {
    return false;
  }

  return classItem.mentor_id === Number(userId);
};

export const isMemberOfClass = async (userId, classId) => {
  const membership = await prisma.class_members.findUnique({
    where: {
      class_id_member_id: {
        class_id: Number(classId),
        member_id: Number(userId),
      },
    },
  });

  return Boolean(membership);
};

// Mentor không phải role: user là mentor của class khi class.mentor_id === user.id
export const assertCanViewClass = async (user, classId) => {
  if (user.role === "ADMIN") return;

  const classItem = await prisma.classes.findUnique({
    where: { id: Number(classId) },
    select: { mentor_id: true },
  });
  if (!classItem) throw new NotFoundError("Class not found");

  const userId = Number(user.sub);
  if (classItem.mentor_id === userId) return;
  if (await isMemberOfClass(userId, classId)) return;

  throw new ForbiddenError("You do not have permission to view this class");
};
