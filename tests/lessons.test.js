import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { api, loginAs, auth } from "./helpers.js";

// Seed: BE 01 (id 1) có 8 lesson (id 1-8), member@ xong 8/8, member3@ xong 0/8,
// mentor2@ (mentor FE 01) là member BE 01 và xong 1/8. DevOps 01 (id 3) không có lesson.
const BE01 = 1;
const DEVOPS01 = 3;
const LESSON_1 = 1;
const TEST_ORDER = 100; // lesson do test tạo có order >= 100, after() xóa
const t = {};
let member3Id;

before(async () => {
  for (const key of ["admin", "mentor", "mentor2", "member", "member3", "member7", "member8"]) {
    t[key] = await loginAs(`${key}@sgroup.com`);
  }
  member3Id = (await prisma.users.findUniqueOrThrow({ where: { email: "member3@sgroup.com" } })).id;
});

after(async () => {
  await prisma.lessons.deleteMany({ where: { class_id: BE01, order_no: { gte: TEST_ORDER } } });
  await prisma.lesson_progress.deleteMany({
    where: { member_id: member3Id, lessons: { class_id: BE01 } },
  });
  await prisma.$disconnect();
});

const req = (method, url, token, body) => {
  const r = api()[method](url);
  if (token) r.set(auth(token));
  return body === undefined ? r : r.send(body);
};
const newLesson = (order = TEST_ORDER) => ({ title: "Test Lesson", content: "Nội dung test", order });

// ---------- #15 GET /classes/:id/lessons ----------
test("#15 member xem list: sắp theo order, có completed", async () => {
  const res = await req("get", `/classes/${BE01}/lessons`, t.member);
  assert.equal(res.status, 200);
  const list = res.body.data;
  assert.equal(list.length, 8);
  assert.deepEqual(Object.keys(list[0]).sort(), ["classId", "completed", "id", "order", "title"]);
  assert.deepEqual(list.map((l) => l.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(list.every((l) => l.completed === true));
});

test("#15 member3 chưa học bài nào: completed đều false", async () => {
  const res = await req("get", `/classes/${BE01}/lessons`, t.member3);
  assert.ok(res.body.data.every((l) => l.completed === false));
});

test("#15 mentor và admin: không có field completed", async () => {
  for (const token of [t.mentor, t.admin]) {
    const res = await req("get", `/classes/${BE01}/lessons`, token);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every((l) => !("completed" in l)));
  }
});

test("#15 lỗi: không token 401, ngoài lớp 403, lớp không có 404, id sai 400", async () => {
  assert.equal((await req("get", `/classes/${BE01}/lessons`)).status, 401);
  assert.equal((await req("get", `/classes/${BE01}/lessons`, t.member8)).status, 403);
  assert.equal((await req("get", "/classes/999999/lessons", t.member)).status, 404);
  assert.equal((await req("get", "/classes/999999/lessons", t.admin)).status, 404);
  assert.equal((await req("get", "/classes/abc/lessons", t.member)).status, 400);
});

// ---------- #16 GET /lessons/:id ----------
test("#16 member xem chi tiết: đúng format spec", async () => {
  const res = await req("get", `/lessons/${LESSON_1}`, t.member);
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.data).sort(), [
    "classId", "content", "createdBy", "id", "order", "title",
  ]);
});

test("#16 lỗi: ngoài lớp 403, không có 404, id sai 400 (không còn 500)", async () => {
  assert.equal((await req("get", `/lessons/${LESSON_1}`, t.member8)).status, 403);
  assert.equal((await req("get", "/lessons/999999", t.member)).status, 404);
  assert.equal((await req("get", "/lessons/abc", t.member)).status, 400);
});

// ---------- #17-19 POST / PATCH / DELETE ----------
test("#17-19 mentor tạo 201, sửa 200, xóa 204, xem lại 404", async () => {
  const created = await req("post", `/classes/${BE01}/lessons`, t.mentor, newLesson());
  assert.equal(created.status, 201);
  const lesson = created.body.data;
  assert.equal(lesson.order, TEST_ORDER);
  assert.equal(lesson.classId, BE01);
  assert.equal(typeof lesson.createdBy, "number");

  const updated = await req("patch", `/lessons/${lesson.id}`, t.mentor, { title: "Test Lesson 2", order: TEST_ORDER + 1 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.title, "Test Lesson 2");
  assert.equal(updated.body.data.order, TEST_ORDER + 1);

  assert.equal((await req("delete", `/lessons/${lesson.id}`, t.mentor)).status, 204);
  assert.equal((await req("get", `/lessons/${lesson.id}`, t.mentor)).status, 404);
});

test("#17 order trùng trong lớp -> 409 (BR-15)", async () => {
  const res = await req("post", `/classes/${BE01}/lessons`, t.mentor, newLesson(1));
  assert.equal(res.status, 409);
});

test("#18 sửa order trùng -> 409 (BR-15)", async () => {
  const res = await req("patch", `/lessons/${LESSON_1}`, t.mentor, { order: 2 });
  assert.equal(res.status, 409);
});

test("#17 admin, mentor lớp khác, member tạo -> 403 (BR-14, BR-28)", async () => {
  for (const token of [t.admin, t.mentor2, t.member]) {
    const res = await req("post", `/classes/${BE01}/lessons`, token, newLesson(TEST_ORDER + 5));
    assert.equal(res.status, 403);
  }
});

test("#18-19 admin sửa và xóa -> 403 (BR-14)", async () => {
  assert.equal((await req("patch", `/lessons/${LESSON_1}`, t.admin, { title: "Hack" })).status, 403);
  assert.equal((await req("delete", `/lessons/${LESSON_1}`, t.admin)).status, 403);
});

test("#17-18 body sai -> 400", async () => {
  const bad = [{}, { title: "", order: 1 }, { title: "A", order: 0 }, { title: "A", order: "1" }];
  for (const body of bad) {
    assert.equal((await req("post", `/classes/${BE01}/lessons`, t.mentor, body)).status, 400);
  }
  assert.equal((await req("patch", `/lessons/${LESSON_1}`, t.mentor, {})).status, 400);
});

// ---------- #20 POST /lessons/:id/complete ----------
test("#20 complete 2 lần: cùng 200, chỉ 1 bản ghi (BR-17)", async () => {
  const first = await req("post", `/lessons/${LESSON_1}/complete`, t.member3);
  assert.equal(first.status, 200);
  assert.deepEqual(Object.keys(first.body.data).sort(), ["completedAt", "lessonId", "memberId"]);
  assert.equal((await req("post", `/lessons/${LESSON_1}/complete`, t.member3)).status, 200);
  const rows = await prisma.lesson_progress.count({
    where: { lesson_id: LESSON_1, member_id: member3Id },
  });
  assert.equal(rows, 1);
});

test("#20 mentor, admin, người ngoài lớp complete -> 403 (BR-16)", async () => {
  for (const token of [t.mentor, t.admin, t.member8]) {
    assert.equal((await req("post", `/lessons/${LESSON_1}/complete`, token)).status, 403);
  }
  assert.equal((await req("post", "/lessons/999999/complete", t.member)).status, 404);
});

// ---------- #21 GET /classes/:id/progress ----------
test("#21 progress = round(completed / total * 100) (BR-18)", async () => {
  const res = await req("get", `/classes/${BE01}/progress`, t.member3); // đã complete 1 bài ở test #20
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, { totalLessons: 8, completedLessons: 1, progress: 13 });

  const full = await req("get", `/classes/${BE01}/progress`, t.member);
  assert.deepEqual(full.body.data, { totalLessons: 8, completedLessons: 8, progress: 100 });
});

test("#21 lớp không có lesson -> progress 0 (BR-18)", async () => {
  const res = await req("get", `/classes/${DEVOPS01}/progress`, t.member7);
  assert.deepEqual(res.body.data, { totalLessons: 0, completedLessons: 0, progress: 0 });
});

test("#21 mentor và admin gọi -> 403 (chỉ member)", async () => {
  assert.equal((await req("get", `/classes/${BE01}/progress`, t.mentor)).status, 403);
  assert.equal((await req("get", `/classes/${BE01}/progress`, t.admin)).status, 403);
});
