import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/config/prisma.config.js";
import { getRedis, waitForRedis } from "../src/config/redis.config.js";
import { cacheKeys } from "../src/utils/cache.js";
import { api, loginAs, auth, PASSWORD } from "./helpers.js";

// Cần Redis đang chạy và REDIS_URL trong .env. Không có thì cả file được bỏ qua.
const redisOn = await waitForRedis();
const skip = redisOn ? false : "Redis chưa chạy hoặc chưa đặt REDIS_URL";

const LOCKED_EMAIL = "member2@sgroup.com";
const BE01 = 1;
const t = {};

before(async () => {
  if (skip) return;
  t.mentor = await loginAs("mentor@sgroup.com");
  t.member = await loginAs("member@sgroup.com");
});

after(async () => {
  // Xóa mọi bộ đếm đăng nhập sai do test tạo (kể cả của auth.test.js), tránh bị khóa ở lần chạy sau
  const redis = getRedis();
  if (redis) {
    for (const key of await redis.keys("login:fail:*")) await redis.del(key);
  }
  await prisma.assignments.deleteMany({ where: { title: { startsWith: "Redis Test" } } });
  await prisma.$disconnect();
});

const login = (email, password) => api().post("/auth/login").send({ email, password });

// ---------- Rate limit đăng nhập ----------
test("Sai mật khẩu 5 lần -> lần 6 bị 429, kể cả khi mật khẩu đúng", { skip }, async () => {
  for (let i = 0; i < 5; i++) {
    assert.equal((await login(LOCKED_EMAIL, "WrongPass1")).status, 401);
  }
  const locked = await login(LOCKED_EMAIL, PASSWORD);
  assert.equal(locked.status, 429);
  assert.match(locked.body.message, /Too many failed login attempts/);
});

test("Đăng nhập đúng thì xóa bộ đếm lần sai", { skip }, async () => {
  const email = "member3@sgroup.com";
  await login(email, "WrongPass1");
  await login(email, "WrongPass1");
  assert.equal((await login(email, PASSWORD)).status, 200);
  const keys = await getRedis().keys(`login:fail:${email}:*`);
  assert.equal(keys.length, 0);
});

// ---------- Logout thu hồi access token ----------
test("Logout xong, access token cũ bị 401", { skip }, async () => {
  const token = await loginAs("member4@sgroup.com");
  assert.equal((await api().get("/auth/me").set(auth(token))).status, 200);
  assert.equal((await api().post("/auth/logout").set(auth(token))).status, 200);

  const after = await api().get("/auth/me").set(auth(token));
  assert.equal(after.status, 401);
  assert.equal(after.body.message, "Token has been revoked");
});

test("Logout 1 token không ảnh hưởng token khác của cùng user", { skip }, async () => {
  const a = await loginAs("member5@sgroup.com");
  const b = await loginAs("member5@sgroup.com");
  await api().post("/auth/logout").set(auth(a));
  assert.equal((await api().get("/auth/me").set(auth(a))).status, 401);
  assert.equal((await api().get("/auth/me").set(auth(b))).status, 200);
});

// ---------- Cache danh sách assignment ----------
test("GET assignments lưu cache; mentor tạo bài mới thì cache bị xóa", { skip }, async () => {
  const key = cacheKeys.assignmentsOfClass(BE01);
  await getRedis().del(key);

  const first = await api().get(`/classes/${BE01}/assignments`).set(auth(t.member));
  assert.equal(first.status, 200);
  assert.equal(await getRedis().exists(key), 1);

  const cached = await api().get(`/classes/${BE01}/assignments`).set(auth(t.member));
  assert.deepEqual(cached.body.data, first.body.data); // đọc từ cache vẫn ra đúng dữ liệu

  const created = await api()
    .post(`/classes/${BE01}/assignments`)
    .set(auth(t.mentor))
    .send({
      title: "Redis Test",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      maximumScore: 10,
    });
  assert.equal(created.status, 201);
  assert.equal(await getRedis().exists(key), 0);

  const fresh = await api().get(`/classes/${BE01}/assignments`).set(auth(t.member));
  assert.equal(fresh.body.data.length, first.body.data.length + 1);
});

test("Người ngoài lớp vẫn bị 403 dù danh sách đã có trong cache", { skip }, async () => {
  await api().get(`/classes/${BE01}/assignments`).set(auth(t.member)); // nạp cache
  const outsider = await loginAs("member8@sgroup.com");
  assert.equal((await api().get(`/classes/${BE01}/assignments`).set(auth(outsider))).status, 403);
});

test("GET /health/redis -> 200", { skip }, async () => {
  const res = await api().get("/health/redis");
  assert.equal(res.status, 200);
  assert.equal(res.body.data.pong, "PONG");
});
