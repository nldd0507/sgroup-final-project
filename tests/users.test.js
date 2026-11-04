import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { api, loginAs } from "./helpers.js";

let adminToken, memberToken;
const email = `test.user.${Date.now()}@sgroup.dev`;

before(async () => {
  adminToken = await loginAs("admin@sgroup.com");
  memberToken = await loginAs("member@sgroup.com");
});
after(async () => {
  await prisma.users.deleteMany({ where: { email: { startsWith: "test.user." } } });
  await prisma.$disconnect();
});

const createUser = (token, body) =>
  api().post("/users").set("Authorization", `Bearer ${token}`).send(body);
const valid = { name: "Test User", email, password: "Password123" };

test("POST /users: admin tạo được user, role mặc định MEMBER, không lộ password", async () => {
  const res = await createUser(adminToken, valid);
  assert.equal(res.status, 201);
  assert.equal(res.body.data.role, "MEMBER");
  assert.equal(res.body.data.password_hash, undefined);
  assert.ok(res.body.data.createdAt);
});
test("POST /users: email trùng → 409", async () => {
  assert.equal((await createUser(adminToken, valid)).status, 409);
});
test("POST /users: không token → 401", async () => {
  assert.equal((await api().post("/users").send(valid)).status, 401);
});
test("POST /users: member gọi → 403", async () => {
  assert.equal((await createUser(memberToken, { ...valid, email: `x.${email}` })).status, 403);
});
test("POST /users: password < 8 ký tự → 400", async () => {
  assert.equal((await createUser(adminToken, { ...valid, password: "123" })).status, 400);
});

const getUsers = (token) => api().get("/users").set("Authorization", `Bearer ${token}`);

test("GET /users: admin xem được danh sách, đúng format, không lộ password", async () => {
  const res = await getUsers(adminToken);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.some((u) => u.email === "admin@sgroup.com"));
  for (const user of res.body.data) {
    assert.deepEqual(Object.keys(user).sort(), ["createdAt", "email", "id", "name", "role"]);
  }
});
test("GET /users: sắp xếp theo id tăng dần", async () => {
  const ids = (await getUsers(adminToken)).body.data.map((u) => u.id);
  assert.deepEqual(
    ids,
    [...ids].sort((a, b) => a - b)
  );
});
test("GET /users: không token → 401", async () => {
  assert.equal((await api().get("/users")).status, 401);
});
test("GET /users: member gọi → 403", async () => {
  assert.equal((await getUsers(memberToken)).status, 403);
});
