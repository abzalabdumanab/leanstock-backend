const Joi = require("joi");

const reasons = ["DAMAGE", "THEFT", "SURPLUS", "EXPIRY", "COUNT_CORRECTION"];

const adjustmentSchema = Joi.object({
  warehouseId: Joi.string().required(),
  reason: Joi.string().valid(...reasons).required(),
  note: Joi.string().max(500).allow("", null),
  items: Joi.array().items(Joi.object({
    variantId: Joi.string().required(),
    delta: Joi.number().integer().invalid(0).required()
  })).min(1).required()
});

module.exports = { adjustmentSchema };
