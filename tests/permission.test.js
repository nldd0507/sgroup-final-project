import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { assertCanViewClass } from "../src/utils/permission.js";

let admin, mentor, member, cls;

before(async () => {
  [admin, mentor, member] = await Promise.all(
    ["admin@sgroup.com", "mentor@sgroup.com", "member@sgroup.com"].map((email) =>
      prisma.users.findUniqueOrThrow({ where: { email } })
    )
  );
  cls = await prisma.classes.create({
    data: {
      name: "Permission Test",
      start_date: new Date("2026-11-01"),
      end_date: new Date("2026-12-01"),
      mentor_id: mentor.id,
    },
  });
});

after(async () => {
  if (cls) await prisma.classes.delete({ where: { id: cls.id } });
  await prisma.$disconnect();
});

const asToken = (user) => ({ sub: user.id, role: user.role });

test("admin xem được mọi class", async () => {
  await assert.doesNotReject(assertCanViewClass(asToken(admin), cls.id));
});

test("mentor (role MEMBER) xem được class mình phụ trách", async () => {
  await assert.doesNotReject(assertCanViewClass(asToken(mentor), cls.id));
});

test("member chưa vào class → 403", async () => {
  await assert.rejects(assertCanViewClass(asToken(member), cls.id), { statusCode: 403 });
});

test("member đã vào class → xem được", async () => {
  await prisma.class_members.create({ data: { class_id: cls.id, member_id: member.id } });
  await assert.doesNotReject(assertCanViewClass(asToken(member), cls.id));
});

test("class không tồn tại → 404", async () => {
  await assert.rejects(assertCanViewClass(asToken(mentor), 999999), { statusCode: 404 });
});
