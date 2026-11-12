import { config } from "./env.config.js";
import { createClient } from "redis";

const client = config.redis.url
  ? createClient({
      url: config.redis.url,
      disableOfflineQueue: true,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
      },
    })
  : null;
if (client) {
  client.on("error", (err) => console.error(`[Redis] ${err.message}`));
  client.connect().catch(() => {});
}

export const getRedis = () => (client?.isReady ? client : null);

export const withRedis = async (fn, fallback = null) => {
  const redis = getRedis();
  if (!redis) return fallback;
  try {
    return await fn(redis);
  } catch (err) {
    console.error(`[Redis] ${err.message}`);
    return fallback;
  }
};

export const waitForRedis = (ms = 3000) => {
  if (!client || client.isReady) return Promise.resolve(Boolean(client));
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    client.once("ready", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
};
