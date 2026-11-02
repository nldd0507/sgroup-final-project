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