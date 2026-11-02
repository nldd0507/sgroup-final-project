import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.users.upsert({
    where: { email: "admin@sgroup.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@sgroup.com",
      password_hash: passwordHash,
      role: "ADMIN",
    },
  });

  // 2. Tạo tài khoản Mentor
  const mentor = await prisma.users.upsert({
    where: { email: "mentor@sgroup.com" },
    update: {},
    create: {
      name: "Mentor Alpha",
      email: "mentor@sgroup.com",
      password_hash: passwordHash,
      role: "MEMBER",
    },
  });

  // 3. Tạo tài khoản Member/Học viên
  const member = await prisma.users.upsert({
    where: { email: "member@sgroup.com" },
    update: {},
    create: {
      name: "Hoc Vien SGroup",
      email: "member@sgroup.com",
      password_hash: passwordHash,
      role: "MEMBER",
    },
  });

  console.log("Seeding hoàn tất:", {
    admin: admin.email,
    mentor: mentor.email,
    member: member.email,
  });
}

main()
  .catch((err) => {
    console.error("Lỗi khi seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });