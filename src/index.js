import app from "./app.js";
import { config } from "./config/env.config.js";
import { waitForRedis } from "./config/redis.config.js";

const redisReady = await waitForRedis();
console.log(
  config.redis.url
    ? `Redis: ${redisReady ? "connected" : "NOT connected, running without Redis"}`
    : "Redis: disabled (REDIS_URL is empty)"
);

app.listen(config.app.port, () => {
  console.log(`Server is running on http://localhost:${config.app.port}`);
});
