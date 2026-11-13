import * as lessonRepository from "../repository/lesson.repository.js";
import { ConflictError, NotFoundError } from "../core/error.response.js";
import {
  assertCanViewClass,
  assertMemberOfClass,
  assertMentorOfClass,
  isMemberOfClass,
} from "../utils/permission.js";

export const toLessonResponse = (l) => ({
  id: l.id,
  classId: l.class_id,
  title: l.title,
  content: l.content,
  order: l.order_no,
  createdBy: l.created_by,
});

export const findLessonOrNotFound = async (id) => {
  const lesson = await lessonRepository.findById(id);
  if (!lesson) throw new NotFoundError("Lesson not found");
  return lesson;
};

// Trùng order trong cùng lớp -> unique uq_lesson_order -> Prisma P2002 -> 409 (BR-15)
const rethrowDuplicateOrder = (error) => {
  if (error.code === "P2002") throw new ConflictError("Lesson order already exists in this class");
  throw error;
};

// #15: chỉ member mới có field `completed`
export const getByClass = async (user, classId) => {
  await assertCanViewClass(user, classId);
  const lessons = await lessonRepository.findByClass(classId);
  const isMember = await isMemberOfClass(user.sub, classId);
  const done = isMember
    ? await lessonRepository.findCompletedLessonIds(classId, user.sub)
    : new Set();
  return lessons.map((l) => ({
    id: l.id,
    classId: l.class_id,
    title: l.title,
    order: l.order_no,
    ...(isMember && { completed: done.has(l.id) }),
  }));
};

// #16
export const getById = async (user, id) => {
  const lesson = await findLessonOrNotFound(id);
  await assertCanViewClass(user, lesson.class_id);
  return toLessonResponse(lesson);
};

// #17
export const create = async (user, classId, { title, content, order }) => {
  await assertMentorOfClass(user, classId); // BR-14
  const lesson = await lessonRepository
    .create({
      class_id: Number(classId),
      title,
      content,
      order_no: order,
      created_by: Number(user.sub),
    })
    .catch(rethrowDuplicateOrder);
  return toLessonResponse(lesson);
};

// #18
export const update = async (user, id, { title, content, order }) => {
  const lesson = await findLessonOrNotFound(id);
  await assertMentorOfClass(user, lesson.class_id);
  const data = { updated_at: new Date() };
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (order !== undefined) data.order_no = order;
  const updated = await lessonRepository.update(id, data).catch(rethrowDuplicateOrder);
  return toLessonResponse(updated);
};

// #19
export const remove = async (user, id) => {
  const lesson = await findLessonOrNotFound(id);
  await assertMentorOfClass(user, lesson.class_id);
  await lessonRepository.remove(id);
};

// #20
export const complete = async (user, id) => {
  const lesson = await findLessonOrNotFound(id);
  await assertMemberOfClass(user, lesson.class_id); // BR-16
  const p = await lessonRepository.upsertProgress(id, user.sub); // BR-17
  return { lessonId: p.lesson_id, memberId: p.member_id, completedAt: p.completed_at };
};

// #21: chỉ member, xem tiến độ của chính mình
export const getProgress = async (user, classId) => {
  await assertMemberOfClass(user, classId);
  const [totalLessons, completedLessons] = await Promise.all([
    lessonRepository.countByClass(classId),
    lessonRepository.countCompleted(classId, user.sub),
  ]);
  const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100); // BR-18
  return { totalLessons, completedLessons, progress };
};
