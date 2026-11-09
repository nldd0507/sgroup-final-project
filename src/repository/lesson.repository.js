import prisma from "../config/prisma.config.js";

export const lessonRepository = {
  async createLesson(data) {
    return prisma.lessons.create({
      data,
    });
  },

  // Tìm lesson theo ID kèm thông tin lớp (classes)
  async findById(id) {
    return prisma.lessons.findUnique({
      where: { id: Number(id) },
      include: { classes: true },
    });
  },

  // Lấy danh sách lesson theo class_id, sắp xếp theo order_no tăng dần
  async findByClassId(classId) {
    return prisma.lessons.findMany({
      where: { class_id: Number(classId) },
      orderBy: { order_no: "asc" },
    });
  },

  async updateLesson(id, data) {
    return prisma.lessons.update({
      where: { id: Number(id) },
      data,
    });
  },

  async deleteLesson(id) {
    return prisma.lessons.delete({
      where: { id: Number(id) },
    });
  },

  // Đánh dấu hoàn thành bài học (Idempotent dùng upsert)
  async upsertLessonProgress(lessonId, memberId) {
    return prisma.lesson_progress.upsert({
      where: {
        lesson_id_member_id: {
          lesson_id: Number(lessonId),
          member_id: Number(memberId),
        },
      },
      update: {}, // Đã hoàn thành rồi thì giữ nguyên
      create: {
        lesson_id: Number(lessonId),
        member_id: Number(memberId),
      },
    });
  },

  async countLessonsByClassId(classId) {
    return prisma.lessons.count({
      where: { class_id: Number(classId) },
    });
  },

  async countCompletedLessons(classId, memberId) {
    return prisma.lesson_progress.count({
      where: {
        member_id: Number(memberId),
        lessons: {
          class_id: Number(classId),
        },
      },
    });
  },
};