import request from "supertest";
import app from "../src/app.js";

export const PASSWORD = "Password123!";
export const api = () => request(app);
export const loginAs = async (email) =>
  (await api().post("/auth/login").send({ email, password: PASSWORD })).body.data.accessToken;

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
export const expectAdminOnly = async (assert, method, url, memberToken, body = {}) => {
  assert.equal((await api()[method](url).send(body)).status, 401);
  assert.equal((await api()[method](url).set(auth(memberToken)).send(body)).status, 403);
};
