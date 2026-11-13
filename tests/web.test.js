import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "./helpers.js";

// Chỉ chạy khi đã build giao diện (cd web && npm run build)
const built = fs.existsSync(new URL("../web/dist/index.html", import.meta.url));

test("Giao diện: / chuyển sang /app/, mọi đường dẫn dưới /app trả index.html", { skip: !built }, async () => {
  const root = await api().get("/");
  assert.equal(root.status, 302);
  assert.equal(root.headers.location, "/app/");

  for (const url of ["/app", "/app/", "/app/login", "/app/classes/1"]) {
    const res = await api().get(url);
    assert.equal(res.status, 200, url);
    assert.match(res.headers["content-type"], /text\/html/);
    assert.match(res.text, /<div id="root">/);
  }
});

test("Giao diện không che API: /classes vẫn là API (401 khi thiếu token)", { skip: !built }, async () => {
  const res = await api().get("/classes");
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});
