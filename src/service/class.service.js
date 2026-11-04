import { BadRequestError, NotFoundError } from "../core/error.response.js";
import * as userRepository from "../repository/user.repository.js";
import * as classRepository from "../repository/class.repository.js";
import { assertCanViewClass } from "../utils/permission.js";

// Cột @db.Date trả về Date → format "YYYY-MM-DD" theo spec
const toDate = (d) => d.toISOString().slice(0, 10);

export const toClassResponse = (c) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  startDate: toDate(c.start_date),
  endDate: toDate(c.end_date),
  mentorId: c.mentor_id,
});

const assertMentorExists = async (mentorId) => {
  if (!(await userRepository.findById(mentorId))) throw new NotFoundError("Mentor not found");
};

export const getClasses = async (user) => {
  const classes =
    user.role === "ADMIN"
      ? await classRepository.findAll()
      : await classRepository.findVisibleTo(Number(user.sub));
  return classes.map(toClassResponse);
};

export const getClassById = async (user, id) => {
  await assertCanViewClass(user, id);
  const c = await classRepository.findById(id);
  // Admin được assertCanViewClass cho qua sớm, nên vẫn phải kiểm tra tồn tại
  if (!c) throw new NotFoundError("Class not found");
  return { ...toClassResponse(c), mentor: c.users };
};

export const createClass = async ({ name, description, startDate, endDate, mentorId }) => {
  await assertMentorExists(mentorId);
  const c = await classRepository.create({
    name,
    description,
    start_date: new Date(startDate),
    end_date: new Date(endDate),
    mentor_id: mentorId,
  });
  return toClassResponse(c);
};

export const updateClass = async (id, body) => {
  const existing = await classRepository.findById(id);
  if (!existing) throw new NotFoundError("Class not found");

  const startDate = body.startDate ?? toDate(existing.start_date);
  const endDate = body.endDate ?? toDate(existing.end_date);
  if (endDate <= startDate) throw new BadRequestError("End date must be after start date");
  if (body.mentorId !== undefined) await assertMentorExists(body.mentorId);

  const data = { updated_at: new Date() };
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.startDate) data.start_date = new Date(body.startDate);
  if (body.endDate) data.end_date = new Date(body.endDate);
  if (body.mentorId !== undefined) data.mentor_id = body.mentorId;

  return toClassResponse(await classRepository.update(id, data));
};

export const deleteClass = async (id) => {
  if (!(await classRepository.findById(id))) throw new NotFoundError("Class not found");
  await classRepository.remove(id);
};
