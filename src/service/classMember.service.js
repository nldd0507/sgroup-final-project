import * as classMemberRepository from "../repository/classMember.repository.js";
import classRepository from "../repository/class.repository.js";

import * as userRepository from "../repository/user.repository.js";
import { isMemberOfClass } from "../utils/permission.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../core/error.response.js";

const findClassOrNotFound = async (classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new NotFoundError("Class not found");
  return classItem;
};

export const getMembers = async (user, classId) => {
  const classItem = await findClassOrNotFound(classId);

  if (user.role !== "ADMIN" && classItem.mentor_id !== Number(user.sub)) {
    throw new ForbiddenError("Only admin or the class mentor can view members");
  }
  const rows = await classMemberRepository.findByClass(classId);
  return rows.map((r) => ({
    memberId: r.member_id,
    name: r.users.name,
    email: r.users.email,
    joinedAt: r.joined_at,
  }));
};

export const addMember = async (classId, memberId) => {
  const classItem = await findClassOrNotFound(classId);
  if (!(await userRepository.findById(memberId))) throw new NotFoundError("User not found");

  if (classItem.mentor_id === memberId) {
    throw new BadRequestError("The mentor cannot be a member of their own class");
  }

  if (await isMemberOfClass(memberId, classId)) {
    throw new ConflictError("Member already in class");
  }

  const row = await classMemberRepository.create(classId, memberId);
  return { classId: row.class_id, memberId: row.member_id, joinedAt: row.joined_at };
};

export const removeMember = async (classId, memberId) => {
  await findClassOrNotFound(classId);
  if (!(await isMemberOfClass(memberId, classId))) throw new NotFoundError("Member not in class");
  await classMemberRepository.remove(classId, memberId);
};
