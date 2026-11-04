import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { api, loginAs, auth, expectAdminOnly } from "./helpers.js";

let tokens = {};
let ids = {};

before(async () => {
  for (const [key, email] of Object.entries({
    admin: "admin@sgroup.com",
    member: "member@sgroup.com",       // học BE 01 + FE 01
    mentor: "mentor@sgroup.com",       // mentor BE 01, BE 00
    mentor2: "mentor2@sgroup.com",     // mentor FE 01, member BE 01
    free: "member8@sgroup.com",        // không thuộc lớp nào
  })) {
    tokens[key] = await loginAs(email);
  }
  const byName = async (name) => (await prisma.classes.findFirstOrThrow({ where: { name } })).id;
  ids.be01 = await byName("BE Basic - Batch 01");
  ids.fe01 = await byName("FE Basic - Batch 01");
  ids.mentor = (await prisma.users.findUniqueOrThrow({ where: { email: "mentor@sgroup.com" } })).id;
  ids.mentor2 = (await prisma.users.findUniqueOrThrow({ where: { email: "mentor2@sgroup.com" } })).id;
});

after(async () => {
  await prisma.classes.deleteMany({ where: { name: { startsWith: "Test Class" } } });
  await prisma.$disconnect();
});

const get = (url, token) => api().get(url).set(auth(token));
const validClass = () => ({
  name: `Test Class ${Date.now()}`,
  description: "Created by test",
  startDate: "2026-12-01",
  endDate: "2027-01-31",
  mentorId: ids.mentor,
});
const createClass = (body, token = tokens.admin) => api().post("/classes").set(auth(token)).send(body);
const classIds = (res) => res.body.data.map((c) => c.id);

// ---------- GET /classes (#7) ----------
test("GET /classes: admin thấy tất cả lớp, đúng format", async () => {
  const res = await get("/classes", tokens.admin);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 4);
  assert.deepEqual(Object.keys(res.body.data[0]).sort(),
    ["description", "endDate", "id", "mentorId", "name", "startDate"]);
  assert.match(res.body.data[0].startDate, /^\d{4}-\d{2}-\d{2}$/);
});

test("GET /classes: member chỉ thấy lớp mình tham gia (BR-13)", async () => {
  assert.deepEqual(classIds(await get("/classes", tokens.member)).sort(), [ids.be01, ids.fe01].sort());
});

test("GET /classes: người vừa là mentor vừa là member thấy cả hai lớp", async () => {
  assert.deepEqual(classIds(await get("/classes", tokens.mentor2)).sort(), [ids.be01, ids.fe01].sort());
});

test("GET /classes: user không thuộc lớp nào nhận mảng rỗng", async () => {
  const res = await get("/classes", tokens.free);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
});

test("GET /classes: không token → 401", async () => {
  assert.equal((await api().get("/classes")).status, 401);
});

// ---------- GET /classes/:id (#8) ----------
test("GET /classes/:id: mentor xem lớp mình dạy, có thông tin mentor", async () => {
  const res = await get(`/classes/${ids.be01}`, tokens.mentor);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.mentor, { id: ids.mentor, name: "Mentor Alpha" });
});

test("GET /classes/:id: member trong lớp xem được", async () => {
  assert.equal((await get(`/classes/${ids.be01}`, tokens.member)).status, 200);
});

test("GET /classes/:id: user không thuộc lớp → 403", async () => {
  assert.equal((await get(`/classes/${ids.be01}`, tokens.free)).status, 403);
});

test("GET /classes/:id: không tồn tại → 404 (admin và member)", async () => {
  assert.equal((await get("/classes/999999", tokens.admin)).status, 404);
  assert.equal((await get("/classes/999999", tokens.member)).status, 404);
});

test("GET /classes/:id: id không phải số → 400", async () => {
  assert.equal((await get("/classes/abc", tokens.admin)).status, 400);
});

// ---------- POST /classes (#9) ----------
test("POST /classes: admin tạo lớp → 201", async () => {
  const body = validClass();
  const res = await createClass(body);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.name, body.name);
  assert.equal(res.body.data.startDate, "2026-12-01");
  assert.equal(res.body.data.endDate, "2027-01-31");
  assert.equal(res.body.data.mentorId, ids.mentor);
});

test("POST /classes: endDate không sau startDate → 400 (BR-07)", async () => {
  assert.equal((await createClass({ ...validClass(), endDate: "2026-11-01" })).status, 400);
  assert.equal((await createClass({ ...validClass(), endDate: "2026-12-01" })).status, 400);
});

test("POST /classes: mentor không tồn tại → 404 (BR-08)", async () => {
  assert.equal((await createClass({ ...validClass(), mentorId: 999999 })).status, 404);
});

test("POST /classes: dữ liệu sai → 400", async () => {
  assert.equal((await createClass({})).status, 400);
  assert.equal((await createClass({ ...validClass(), startDate: "01/12/2026" })).status, 400);
  assert.equal((await createClass({ ...validClass(), name: "A" })).status, 400);
});

test("POST /classes: chỉ admin (401/403)", async () => {
  await expectAdminOnly(assert, "post", "/classes", tokens.member, validClass());
});

// ---------- PATCH /classes/:id (#10) ----------
test("PATCH /classes/:id: đổi tên và chỉ định mentor mới (US-08)", async () => {
  const id = (await createClass(validClass())).body.data.id;
  const res = await api().patch(`/classes/${id}`).set(auth(tokens.admin))
    .send({ name: "Test Class Renamed", mentorId: ids.mentor2 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, "Test Class Renamed");
  assert.equal(res.body.data.mentorId, ids.mentor2);
  assert.equal(res.body.data.startDate, "2026-12-01");   // field không gửi giữ nguyên
});

test("PATCH /classes/:id: chỉ gửi endDate sớm hơn startDate hiện có → 400", async () => {
  const id = (await createClass(validClass())).body.data.id;
  const res = await api().patch(`/classes/${id}`).set(auth(tokens.admin)).send({ endDate: "2026-11-15" });
  assert.equal(res.status, 400);
});

test("PATCH /classes/:id: body rỗng → 400, mentor không tồn tại → 404, lớp không tồn tại → 404", async () => {
  const id = (await createClass(validClass())).body.data.id;
  const patch = (url, body) => api().patch(url).set(auth(tokens.admin)).send(body);
  assert.equal((await patch(`/classes/${id}`, {})).status, 400);
  assert.equal((await patch(`/classes/${id}`, { mentorId: 999999 })).status, 404);
  assert.equal((await patch("/classes/999999", { name: "Test Class Ghost" })).status, 404);
});

test("PATCH /classes/:id: chỉ admin (401/403)", async () => {
  await expectAdminOnly(assert, "patch", `/classes/${ids.be01}`, tokens.member, { name: "Hack" });
});

// ---------- DELETE /classes/:id (#11) ----------
test("DELETE /classes/:id: admin xóa → 204, xem lại → 404, xóa lại → 404", async () => {
  const id = (await createClass(validClass())).body.data.id;
  const del = () => api().delete(`/classes/${id}`).set(auth(tokens.admin));
  const res = await del();
  assert.equal(res.status, 204);
  assert.deepEqual(res.body, {});
  assert.equal((await get(`/classes/${id}`, tokens.admin)).status, 404);
  assert.equal((await del()).status, 404);
});

test("DELETE /classes/:id: xóa lớp thì xóa luôn member (BR-11 cascade)", async () => {
  const id = (await createClass(validClass())).body.data.id;
  const freeUser = await prisma.users.findUniqueOrThrow({ where: { email: "member8@sgroup.com" } });
  await prisma.class_members.create({ data: { class_id: id, member_id: freeUser.id } });
  assert.equal((await api().delete(`/classes/${id}`).set(auth(tokens.admin))).status, 204);
  assert.equal(await prisma.class_members.count({ where: { class_id: id } }), 0);
});

test("DELETE /classes/:id: chỉ admin (401/403)", async () => {
  await expectAdminOnly(assert, "delete", `/classes/${ids.be01}`, tokens.member);
});
