import * as assignmentRepository from "../repository/assignment.repository.js";
import { NotFoundError } from "../core/error.response.js";
import { assertCanViewClass, assertMentorOfClass } from "../utils/permission.js";

export const toAssignmentResponse = (a, { withDescription = false } = {}) => ({
  id: a.id,
  classId: a.class_id,
  title: a.title,
  ...(withDescription && { description: a.description }),
  deadline: a.deadline,
  maximumScore: a.maximum_score,
});

export const findAssignmentOrNotFound = async (id) => {
  const a = await assignmentRepository.findById(id);
  if (!a) throw new NotFoundError("Assignment not found");
  return a;
};

export const getByClass = async (user, classId) => {
  await assertCanViewClass(user, classId);

  return (await assignmentRepository.findByClass(classId)).map((a) => toAssignmentResponse(a));
};

export const getById = async (user, id) => {
  const a = await findAssignmentOrNotFound(id);
  await assertCanViewClass(user, a.class_id);
  return toAssignmentResponse(a, { withDescription: true });
};

export const create = async (user, classId, { title, description, deadline, maximumScore }) => {
  await assertMentorOfClass(user, classId);
  const a = await assignmentRepository.create({
    class_id: classId,
    title,
    description,
    deadline: new Date(deadline),
    maximum_score: maximumScore,
  });
  return toAssignmentResponse(a, { withDescription: true });
};

export const update = async (user, id, body) => {
  const a = await findAssignmentOrNotFound(id);
  await assertMentorOfClass(user, a.class_id);
  const data = { updated_at: new Date() };
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.deadline !== undefined) data.deadline = new Date(body.deadline);
  if (body.maximumScore !== undefined) data.maximum_score = body.maximumScore;
  return toAssignmentResponse(await assignmentRepository.update(id, data), {
    withDescription: true,
  });
};

export const remove = async (user, id) => {
  const a = await findAssignmentOrNotFound(id);
  await assertMentorOfClass(user, a.class_id);
  await assignmentRepository.remove(id);
};
