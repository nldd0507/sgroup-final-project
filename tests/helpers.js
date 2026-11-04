import request from "supertest";
import app from "../src/app.js";

export const PASSWORD = "Password123!";
export const api = () => request(app);
export const loginAs = async (email) =>
  (await api().post("/auth/login").send({ email, password: PASSWORD })).body.data.accessToken;
