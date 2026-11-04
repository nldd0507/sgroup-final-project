import * as userRepository from "../repository/user.repository.js";
import { hashPassword } from "../utils/passwordHelper.js";
import { ConflictError, NotFoundError } from "../core/error.response.js";

export const toUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

export const createUser = async ({ name, email, password, role }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new ConflictError("Email already exists");

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({ name, email, passwordHash, role });
  return toUserResponse(user);
};

export const getUsers = async () => {
  const users = await userRepository.findAll();
  return users.map(toUserResponse);
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError("User not found");
  return toUserResponse(user);
};

export const updateUser = async (id, { name, role, password }) => {
  const existing = await userRepository.findById(id);
  if (!existing) throw new NotFoundError("User not found");

  const data = { updated_at: new Date() };
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (password !== undefined) data.password_hash = await hashPassword(password);

  const user = await userRepository.update(id, data);
  return toUserResponse(user);
};
