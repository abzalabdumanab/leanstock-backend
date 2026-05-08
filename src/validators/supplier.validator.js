const Joi = require("joi");

const supplierSchema = Joi.object({
  name: Joi.string().min(2).max(160).required(),
  email: Joi.string().email().allow(null, ""),
  phone: Joi.string().max(40).allow(null, ""),
  isActive: Joi.boolean().default(true)
});

const updateSupplierSchema = supplierSchema.fork(["name"], (schema) => schema.optional()).min(1);

module.exports = { supplierSchema, updateSupplierSchema };
