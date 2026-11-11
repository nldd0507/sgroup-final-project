import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { api, auth, loginAs, PASSWORD } from "./helpers.js";

after(() => prisma.$disconnect());

test("POST /auth/register không còn tồn tại (không cho tự tạo ADMIN)", async () => {
  const res = await api()
    .post("/auth/register")
    .send({ name: "Hacker", email: "test.hacker@sgroup.dev", password: "Password123", role: "ADMIN" });
  assert.equal(res.status, 404);
  assert.equal(await prisma.users.count({ where: { email: "test.hacker@sgroup.dev" } }), 0);
});

test("POST /auth/login: đúng → 200, sai password hay sai email → cùng 401 (BR-05)", async () => {
  const ok = await api().post("/auth/login").send({ email: "admin@sgroup.com", password: PASSWORD });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.data.accessToken);

  const wrongPassword = await api().post("/auth/login").send({ email: "admin@sgroup.com", password: "WrongPass1" });
  const wrongEmail = await api().post("/auth/login").send({ email: "nobody@sgroup.com", password: "WrongPass1" });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongEmail.status, 401);
  assert.equal(wrongPassword.body.message, wrongEmail.body.message);
});

test("GET /auth/me: token đúng → 200, thiếu token → 401", async () => {
  const token = await loginAs("member@sgroup.com");
  const me = await api().get("/auth/me").set(auth(token));
  assert.equal(me.status, 200);
  assert.equal(me.body.data.email, "member@sgroup.com");
  assert.equal(me.body.data.password_hash, undefined);
  assert.equal((await api().get("/auth/me")).status, 401);
});
