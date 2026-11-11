import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import {
  assertCanViewClass,
  assertMentorOfClass,
  assertMemberOfClass,
} from "../src/utils/permission.js";

// Token giả lập: chỉ cần sub (user id) và role, giống payload JWT
const users = {};
let be01;

before(async () => {
  for (const [key, email] of Object.entries({
    admin: "admin@sgroup.com",
    mentor: "mentor@sgroup.com", //   mentor BE 01
    mentor2: "mentor2@sgroup.com", // mentor FE 01, member BE 01
    member: "member@sgroup.com", //   member BE 01
    free: "member8@sgroup.com", //    không thuộc lớp nào
  })) {
    const u = await prisma.users.findUniqueOrThrow({ where: { email } });
    users[key] = { sub: u.id, role: u.role };
  }
  be01 = (await prisma.classes.findFirstOrThrow({ where: { name: "BE Basic - Batch 01" } })).id;
});

after(() => prisma.$disconnect());

const MISSING = 999999;

test("assertCanViewClass: admin, mentor, member xem được; người ngoài 403; lớp không có 404", async () => {
  for (const key of ["admin", "mentor", "mentor2", "member"]) {
    await assert.doesNotReject(assertCanViewClass(users[key], be01), key);
  }
  await assert.rejects(assertCanViewClass(users.free, be01), { statusCode: 403 });
  await assert.rejects(assertCanViewClass(users.member, MISSING), { statusCode: 404 });
});

test("assertMentorOfClass: chỉ mentor của lớp; admin và mentor lớp khác bị 403 (BR-14, BR-28)", async () => {
  await assert.doesNotReject(assertMentorOfClass(users.mentor, be01));
  await assert.rejects(assertMentorOfClass(users.admin, be01), { statusCode: 403 });
  await assert.rejects(assertMentorOfClass(users.mentor2, be01), { statusCode: 403 });
  await assert.rejects(assertMentorOfClass(users.member, be01), { statusCode: 403 });
  await assert.rejects(assertMentorOfClass(users.mentor, MISSING), { statusCode: 404 });
});

test("assertMemberOfClass: chỉ member của lớp; mentor của lớp và admin bị 403 (BR-16, BR-21)", async () => {
  await assert.doesNotReject(assertMemberOfClass(users.member, be01));
  await assert.doesNotReject(assertMemberOfClass(users.mentor2, be01));
  await assert.rejects(assertMemberOfClass(users.mentor, be01), { statusCode: 403 });
  await assert.rejects(assertMemberOfClass(users.admin, be01), { statusCode: 403 });
  await assert.rejects(assertMemberOfClass(users.free, be01), { statusCode: 403 });
  await assert.rejects(assertMemberOfClass(users.member, MISSING), { statusCode: 404 });
});
