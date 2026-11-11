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

const findClassOr404 = async (classId) => {
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
  if (user.role === "ADMIN") return;

  const classItem = await findClassOr404(classId);
  const userId = Number(user.sub);
  if (classItem.mentor_id === userId) return;
  if (await isMemberOfClass(userId, classId)) return;

  throw new ForbiddenError("You do not have permission to view this class");
};

// Tạo/sửa/xóa lesson, assignment; xem toàn bộ và chấm bài nộp.
// Chỉ mentor của lớp — Admin cũng không được (BR-14, BR-19, BR-25, BR-28)
export const assertMentorOfClass = async (user, classId) => {
  const classItem = await findClassOr404(classId);
  if (classItem.mentor_id !== Number(user.sub)) {
    throw new ForbiddenError("Only the mentor of this class can perform this action");
  }
};

// Hoàn thành lesson, xem progress, nộp bài: chỉ member của lớp (BR-16, BR-21)
export const assertMemberOfClass = async (user, classId) => {
  await findClassOr404(classId);
  if (!(await isMemberOfClass(user.sub, classId))) {
    throw new ForbiddenError("Only members of this class can perform this action");
  }
};
