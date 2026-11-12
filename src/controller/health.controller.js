import * as healthRepository from "../repository/health.repository.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";
import { getRedis } from "../config/redis.config.js";

export const check = (req, res) => {
  return sendSuccess(res, 200, "Server is running");
};

export const checkDb = async (req, res) => {
  const serverTime = await healthRepository.getDbTime();
  return sendSuccess(res, 200, "Database is connected", { serverTime });
};

export const checkRedis = async (req, res) => {
  const redis = getRedis();
  if (!redis) return sendError(res, 503, "Redis is not connected");
  const pong = await redis.ping();
  return sendSuccess(res, 200, "Redis is connected", { pong });
};
