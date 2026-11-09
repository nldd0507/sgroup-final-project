import { lessonRepository } from "../repository/lesson.repository.js";
import classRepository from "../repository/class.repository.js";
import { ForbiddenError, NotFoundError, ConflictError } from "../core/error.response.js";

// Helper kiểm tra quyền xem lớp học: ADMIN, Mentor của lớp hoặc Member trong lớp
async function assertCanViewClass(classId, user) {
  const cls = await classRepository.findById(Number(classId));
  if (!cls) throw new NotFoundError("Class not found");
  
  const userId = user.id ?? user.sub;
  const isMentor = Number(cls.mentor_id) === Number(userId);
  const isAdmin = user.role === "ADMIN";

  if (isAdmin || isMentor) return cls;

  const isMember = await classRepository.isMemberOfClass(Number(classId), Number(userId));
  if (isMember) return cls;

  throw new ForbiddenError("You do not have permission to view this class");
}

export const lessonService = {
  // 1. Tạo lesson
  async createLesson(classId, data, user) {
    const cls = await classRepository.findById(Number(classId));
    if (!cls) throw new NotFoundError("Class not found");

    const mentorIdInClass = cls.mentor_id;
    const currentUserId = user.id ?? user.sub;

    const isMentor = Number(mentorIdInClass) === Number(currentUserId);
    const isAdmin = user.role === "ADMIN";


    if (!isMentor && !isAdmin) {
      throw new ForbiddenError("Only the mentor of this class can create lessons");
    }

    if (!isMentor && !isAdmin) {
      throw new ForbiddenError("Only the mentor of this class can create lessons");
    }

    try {
      return await lessonRepository.createLesson({
        title: data.title,
        content: data.content,
        order_no: Number(data.order_no),
        class_id: Number(classId),
        created_by: Number(currentUserId),
      });
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictError("Lesson order_no already exists in this class");
      }
      throw error;
    }
  },

  // 2. Lấy danh sách lesson của lớp
  async getLessonsByClass(classId, user) {
    await assertCanViewClass(classId, user);
    return lessonRepository.findByClassId(Number(classId));
  },

  // 3. Lấy chi tiết lesson theo ID
  async getLessonById(id, user) {
    const lesson = await lessonRepository.findById(Number(id));
    if (!lesson) throw new NotFoundError("Lesson not found");

    await assertCanViewClass(lesson.class_id, user);
    return lesson;
  },

  // 4. Sửa lesson
  async updateLesson(id, data, user) {
    const lesson = await lessonRepository.findById(Number(id));
    if (!lesson) throw new NotFoundError("Lesson not found");

    // Lấy class_id của lesson (hỗ trợ cả class_id lẫn classId)
    const classId = lesson.class_id ?? lesson.classId;
    const cls = await classRepository.findById(Number(classId));
    if (!cls) throw new NotFoundError("Class not found");

    const mentorId = cls.mentor_id;
    const userId = user.id ?? user.sub;
    const isMentor = Number(mentorId) === Number(userId);
    const isAdmin = user.role === "ADMIN";

    if (!isMentor && !isAdmin) {
      throw new ForbiddenError("Only the mentor of this class can edit this lesson");
    }

    try {
      return await lessonRepository.updateLesson(Number(id), data);
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictError("Lesson order_no already exists in this class");
      }
      throw error;
    }
  },

  // Xóa lesson
  async deleteLesson(id, user) {
    const lesson = await lessonRepository.findById(Number(id));
    if (!lesson) throw new NotFoundError("Lesson not found");

    const classId = lesson.class_id ?? lesson.classId;
    const cls = await classRepository.findById(Number(classId));
    if (!cls) throw new NotFoundError("Class not found");

    const mentorId = cls.mentor_id;
    const userId = user.id ?? user.sub;

    const isMentor = Number(mentorId) === Number(userId);
    const isAdmin = user.role === "ADMIN";

    if (!isMentor && !isAdmin) {
      throw new ForbiddenError("Only the mentor of this class can delete this lesson");
    }

    await lessonRepository.deleteLesson(Number(id));
    return true;
  },

  // 5. Học viên hoàn thành bài học
  async completeLesson(id, user) {
    const lesson = await lessonRepository.findById(Number(id));
    if (!lesson) throw new NotFoundError("Lesson not found");

    const userId = user.id ?? user.sub;
    const isMember = await classRepository.isMemberOfClass(
      Number(lesson.class_id),
      Number(userId)
    );
    if (!isMember) {
      throw new ForbiddenError("Only enrolled members can complete this lesson");
    }

    return lessonRepository.upsertLessonProgress(Number(id), Number(userId));
  },

  // 6. Tính % hoàn thành của lớp
  async getClassProgress(classId, user) {
    await assertCanViewClass(classId, user);
    const userId = user.id ?? user.sub;
    const [totalLessons, completedLessons] = await Promise.all([
      lessonRepository.countLessonsByClassId(Number(classId)),
      lessonRepository.countCompletedLessons(Number(classId), Number(userId)),
    ]);

    const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return {
      totalLessons,
      completedLessons,
      progress,
    };
  },
};
