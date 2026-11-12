import { withRedis } from "../config/redis.config.js";

const key = (jti) => `denylist:${jti}`;

export const revokeToken = async ({ jti, exp }) => {
  if (!jti || !exp) return;
  const secondsLeft = exp - Math.floor(Date.now() / 1000);
  if (secondsLeft <= 0) return;
  await withRedis((r) => r.set(key(jti), "1", { EX: secondsLeft }));
};

export const isTokenRevoked = async (jti) => {
  if (!jti) return false;
  return (await withRedis((r) => r.exists(key(jti)), 0)) === 1;
};
