const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required(),
  DIRECT_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).optional(),
  TEST_DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).optional(),
  REDIS_URL: Joi.string().uri({ scheme: ["redis", "rediss"] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  CORS_ORIGINS: Joi.string().required(),
  APP_BASE_URL: Joi.string().uri().default("http://localhost:3000"),
  SMTP_HOST: Joi.string().hostname().allow("").default(""),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().allow("").default(""),
  SMTP_PASS: Joi.string().allow("").default(""),
  SMTP_FROM: Joi.string().min(3).default("LeanStock <noreply@leanstock.local>"),
  EMAIL_WORKER_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
  DEAD_STOCK_AFTER_DAYS: Joi.number().integer().min(1).default(30),
  DEAD_STOCK_DECAY_PERCENT: Joi.number().min(0.01).max(99).default(10),
  DEAD_STOCK_DECAY_INTERVAL_DAYS: Joi.number().integer().min(1).default(3),
  DEAD_STOCK_CRON: Joi.string().default("0 2 * * *"),
  LOW_STOCK_CRON: Joi.string().default("*/30 * * * *")
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  const details = error.details.map((detail) => detail.message).join("; ");
  throw new Error(`Environment validation failed: ${details}`);
}

const origins = value.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

if (value.NODE_ENV === "production") {
  if (origins.includes("*")) {
    throw new Error("CORS_ORIGINS cannot contain '*' in production");
  }

  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]) {
    if (!value[key]) {
      throw new Error(`${key} is required in production`);
    }
  }
}

module.exports = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  redisUrl: value.REDIS_URL,
  jwtSecret: value.JWT_SECRET,
  jwtRefreshSecret: value.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
  corsOrigins: origins,
  appBaseUrl: value.APP_BASE_URL,
  smtp: {
    host: value.SMTP_HOST,
    port: value.SMTP_PORT,
    user: value.SMTP_USER,
    pass: value.SMTP_PASS,
    from: value.SMTP_FROM
  },
  emailWorkerEnabled: value.EMAIL_WORKER_ENABLED,
  deadStock: {
    afterDays: value.DEAD_STOCK_AFTER_DAYS,
    decayPercent: value.DEAD_STOCK_DECAY_PERCENT,
    decayIntervalDays: value.DEAD_STOCK_DECAY_INTERVAL_DAYS,
    cron: value.DEAD_STOCK_CRON
  },
  lowStockCron: value.LOW_STOCK_CRON
};
