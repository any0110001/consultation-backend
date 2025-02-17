import Redis from "ioredis";
import config from "./envConfig.js"

/**
 * Initialize Redis client
 * @type {Redis}
 */
const redis = new Redis({
  host: config.redis.host || "127.0.0.1",
  port: config.redis.port || 6379,
  password: config.redis.password || undefined,
});

// Error handling
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
