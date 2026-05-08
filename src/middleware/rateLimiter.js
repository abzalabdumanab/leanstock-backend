const { RateLimiterRedis, RateLimiterMemory } = require("rate-limiter-flexible");
const { redis } = require("../config/redis");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const LIMIT_OPTIONS = { points: 20, duration: 60 };
const REDIS_TIMEOUT_MS = 500;

const memoryLimiter = new RateLimiterMemory(LIMIT_OPTIONS);
const redisLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl_auth",
  ...LIMIT_OPTIONS
});

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Rate limiter timeout")), timeoutMs);
    })
  ]);
}

async function consumeWithFallback(key) {
  if (env.nodeEnv === "test" || redis.status !== "ready") {
    return memoryLimiter.consume(key);
  }

  try {
    return await withTimeout(redisLimiter.consume(key), REDIS_TIMEOUT_MS);
  } catch (error) {
    if (error && typeof error.msBeforeNext === "number") {
      throw error;
    }

    return memoryLimiter.consume(key);
  }
}

module.exports = async (req, _res, next) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";

  try {
    await consumeWithFallback(ip);
    return next();
  } catch (_error) {
    return next(new ApiError(429, "Too many attempts. Try again later."));
  }
};
