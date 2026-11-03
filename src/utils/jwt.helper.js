import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

export const generateAccessToken = (payload, expiresIn = config.jwt.accessExpiresIn) => {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn });
}

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};
