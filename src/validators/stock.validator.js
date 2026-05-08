const Joi = require("joi");

const upsertStockSchema = Joi.object({
  variantId: Joi.string().required(),
  warehouseId: Joi.string().required(),
  quantity: Joi.number().integer().min(0).required()
});

const reserveStockSchema = Joi.object({
  variantId: Joi.string().required(),
  warehouseId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  ttlSeconds: Joi.number().integer().min(60).max(86400).default(900)
});

module.exports = { upsertStockSchema, reserveStockSchema };
