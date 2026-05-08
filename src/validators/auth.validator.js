const Joi = require("joi");

const roles = ["SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER", "ANALYST"];

const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[0-9]/, "number")
  .pattern(/[^A-Za-z0-9]/, "symbol")
  .required();

const registerSchema = Joi.object({
  tenantName: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().lowercase().required(),
  password: strongPassword,
  role: Joi.string().valid(...roles).default("TENANT_ADMIN")
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

const tokenSchema = Joi.object({
  token: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const logoutSchema = refreshSchema;

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: strongPassword
});

module.exports = {
  registerSchema,
  loginSchema,
  tokenSchema,
  refreshSchema,
  logoutSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
};
