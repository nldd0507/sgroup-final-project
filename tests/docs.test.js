import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "./helpers.js";

test("GET /docs/ mở được Swagger UI, không cần token", async () => {
  const res = await api().get("/docs/");
  assert.equal(res.status, 200);
  assert.match(res.text, /swagger/i);
});
