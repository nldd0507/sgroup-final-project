import { withRedis } from "../config/redis.config.js";
import { TooManyRequestsError } from "../core/error.response.js";

const MAX_FAILS = 5;
const LOCK_SECONDS = 15 * 60;

export const loginFailKey = (email, ip) => `login:fail:${email.trim().toLowerCase()}:${ip}`;

export const assertNotLocked = async (key) => {
  const fails = await withRedis((r) => r.get(key), null);
  if (Number(fails) < MAX_FAILS) return;
  const ttl = await withRedis((r) => r.ttl(key), LOCK_SECONDS);
  throw new TooManyRequestsError(
    `Too many failed login attempts. Try again in ${Math.ceil(ttl / 60)} minutes`
  );
};

export const recordFailure = (key) =>
  // INCR + EXPIRE NX trong cùng một transaction: key luôn có TTL, không bị khóa vĩnh viễn
  withRedis((r) => r.multi().incr(key).expire(key, LOCK_SECONDS, "NX").exec());

export const resetFailures = (key) => withRedis((r) => r.del(key));
