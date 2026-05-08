const Joi = require("joi");

const tenantSchema = Joi.object({
  name: Joi.string().min(2).max(160).required()
});

module.exports = { tenantSchema };
