import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

// jwtid (jti) để logout thu hồi được từng access token qua Redis denylist
export const generateAccessToken = (payload, expiresIn = config.jwt.accessExpiresIn) => {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn, jwtid: randomUUID() });
};

export const generateRefreshToken = (payload, expiresIn = config.jwt.refreshExpiresIn) => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
