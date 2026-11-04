import prisma from "../config/prisma.config.js";

export const findByEmail = async (email) => {
  return await prisma.users.findUnique({
    where: { email },
  });
};

export const findById = async (id) => {
  return await prisma.users.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const user_public_fields = {
  id: true,
  name: true,
  email: true,
  role: true,
  created_at: true,
};

export const create = async ({ name, email, passwordHash, role }) => {
  return prisma.users.create({
    data: { name, email, password_hash: passwordHash, role },
    select: user_public_fields,
  });
};

export const findAll = async () => {
  return prisma.users.findMany({
    select: user_public_fields,
    orderBy: { id: "asc" },
  });
};

export const update = async (id, data) => {
  return prisma.users.update({
    where: { id: Number(id) },
    data,
    select: user_public_fields,
  });
};

// Cập nhật refresh_token (dùng khi login và logout)
export const updateRefreshToken = async (id, refreshToken) => {
  return await prisma.users.update({
    where: { id: Number(id) },
    data: {
      refresh_token: refreshToken,
    },
    select: {
      id: true,
      email: true,
      role: true,
      refresh_token: true,
    },
  });
};
