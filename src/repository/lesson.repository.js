import prisma from "../config/prisma.config.js";

const lesson_fields = {
  id: true,
  class_id: true,
  title: true,
  content: true,
  order_no: true,
  created_by: true,
};

export const findByClass = (classId) =>
  prisma.lessons.findMany({
    where: { class_id: Number(classId) },
    select: lesson_fields,
    orderBy: { order_no: "asc" },
  });

export const findById = (id) =>
  prisma.lessons.findUnique({ where: { id: Number(id) }, select: lesson_fields });

export const create = (data) => prisma.lessons.create({ data, select: lesson_fields });

export const update = (id, data) =>
  prisma.lessons.update({ where: { id: Number(id) }, data, select: lesson_fields });

export const remove = (id) => prisma.lessons.delete({ where: { id: Number(id) } });

// Id các lesson của lớp mà member đã hoàn thành, dùng để tính field `completed`
export const findCompletedLessonIds = async (classId, memberId) => {
  const rows = await prisma.lesson_progress.findMany({
    where: { member_id: Number(memberId), lessons: { class_id: Number(classId) } },
    select: { lesson_id: true },
  });
  return new Set(rows.map((r) => r.lesson_id));
};

// update: {} -> đã hoàn thành rồi thì giữ nguyên, không tạo bản ghi mới (BR-17)
export const upsertProgress = (lessonId, memberId) =>
  prisma.lesson_progress.upsert({
    where: {
      lesson_id_member_id: { lesson_id: Number(lessonId), member_id: Number(memberId) },
    },
    update: {},
    create: { lesson_id: Number(lessonId), member_id: Number(memberId) },
  });

export const countByClass = (classId) =>
  prisma.lessons.count({ where: { class_id: Number(classId) } });

export const countCompleted = (classId, memberId) =>
  prisma.lesson_progress.count({
    where: { member_id: Number(memberId), lessons: { class_id: Number(classId) } },
  });
