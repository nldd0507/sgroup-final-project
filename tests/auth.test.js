import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/prisma.config.js";

after(() => prisma.$disconnect());

const PASSWORD = "Password123!";
const login = (body) => request(app).post("/auth/login").send(body);
const loginAs = async (email) => (await login({ email, password: PASSWORD })).body.data.accessToken;

test("login đúng → 200 + token, không lộ password", async () => {
  const res = await login({ email: "admin@sgroup.com", password: PASSWORD });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.accessToken);
  assert.equal(res.body.data.user.password_hash, undefined);
});

test("sai password và sai email → cùng 401, cùng message (BR-05)", async () => {
  const wrongPassword = await login({ email: "admin@sgroup.com", password: "SaiMatKhau1" });
  const wrongEmail = await login({ email: "khongton@tai.com", password: "SaiMatKhau1" });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongEmail.status, 401);
  assert.equal(wrongPassword.body.message, wrongEmail.body.message);
});

test("body sai → 400", async () => {
  assert.equal((await login({})).status, 400);
  assert.equal((await login({ email: "khong-phai-email", password: PASSWORD })).status, 400);
});

test("email có khoảng trắng thừa vẫn login được", async () => {
  const res = await login({ email: "  admin@sgroup.com ", password: PASSWORD });
  assert.equal(res.status, 200);
});

test("/auth/me thiếu token → 401", async () => {
  assert.equal((await request(app).get("/auth/me")).status, 401);
});

test("/auth/me thiếu chữ Bearer → 401", async () => {
  const token = await loginAs("admin@sgroup.com");
  const res = await request(app).get("/auth/me").set("Authorization", token);
  assert.equal(res.status, 401);
});

test("/auth/me token rác → 401", async () => {
  const res = await request(app).get("/auth/me").set("Authorization", "Bearer abc.def.ghi");
  assert.equal(res.status, 401);
});

test("/auth/me token đúng → đúng user, không có password_hash", async () => {
  const token = await loginAs("member@sgroup.com");
  const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, "member@sgroup.com");
  assert.equal(res.body.data.password_hash, undefined);
});

test("/login và /me ở gốc không tồn tại", async () => {
  assert.equal((await request(app).post("/login").send({})).status, 404);
  assert.equal((await request(app).get("/me")).status, 404);
});
