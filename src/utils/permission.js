import prisma from "../config/prisma.config.js";
import { ForbiddenError } from "../core/error.response.js";

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
  const membership = await prisma.class_members.findFirst({
    where: {
      class_id: Number(classId),
      member_id: Number(userId),
    },
  });

  return Boolean(membership);
};

export const assertCanViewClass = async (user, classId) => {
  if (user.role === "ADMIN") {
    return true;
  }

  const userId = user.sub || user.id;

  if (user.role === "MENTOR") {
    const isMentor = await isMentorOfClass(userId, classId);
    if (isMentor) return true;
  }

  if (user.role === "MEMBER") {
    const isMember = await isMemberOfClass(userId, classId);
    if (isMember) return true;
  }
  throw new ForbiddenError("You do not have permission to access or view information about this class!");  
}