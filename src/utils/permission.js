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
      class_id_member_id: { class_id: Number(classId), member_id: Number(userId) },
    },
  });

  return Boolean(membership);
};

const findClassOrNotFound = async (classId) => {
  const classItem = await prisma.classes.findUnique({
    where: { id: Number(classId) },
    select: { mentor_id: true },
  });
  if (!classItem) throw new NotFoundError("Class not found");
  return classItem;
};

// Mentor không phải role: là mentor khi classes.mentor_id === user.id

// Xem class và nội dung của class: Admin, mentor của lớp, member của lớp (BR-13, BR-16)
export const assertCanViewClass = async (user, classId) => {
  // Kiểm tra lớp tồn tại trước, kể cả Admin, để lớp không có luôn trả 404
  const classItem = await findClassOrNotFound(classId);
  if (user.role === "ADMIN") return;

  const userId = Number(user.sub);
  if (classItem.mentor_id === userId) return;
  if (await isMemberOfClass(userId, classId)) return;

  throw new ForbiddenError("You do not have permission to view this class");
};

export const assertMentorOfClass = async (user, classId) => {
  const classItem = await findClassOrNotFound(classId);
  if (classItem.mentor_id !== Number(user.sub)) {
    throw new ForbiddenError("Only the mentor of this class can perform this action");
  }
};

export const assertMemberOfClass = async (user, classId) => {
  await findClassOrNotFound(classId);
  if (!(await isMemberOfClass(user.sub, classId))) {
    throw new ForbiddenError("Only members of this class can perform this action");
  }
};
