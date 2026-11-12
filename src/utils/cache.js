import { withRedis } from "../config/redis.config.js";

const DEFAULT_TTL = 300;
export const cacheKeys = {
  assignmentsOfClass: (classId) => `cache:class:${Number(classId)}:assignments`,
};

export const remember = async (key, loader, ttl = DEFAULT_TTL) => {
  const cached = await withRedis((r) => r.get(key));
  if (cached) return JSON.parse(cached);
  const value = await loader();
  await withRedis((r) => r.set(key, JSON.stringify(value), { EX: ttl }));
  return value;
};

export const forget = (key) => withRedis((r) => r.del(key));
