// Түсіндірме: Joi модулін осы файлда қолдану үшін жүктейді.
const Joi = require("joi");

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const variantSchema = Joi.object({
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  sku: Joi.string().min(2).max(64).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  barcode: Joi.string().max(64).optional(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  size: Joi.string().max(40).optional(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  color: Joi.string().max(40).optional(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  material: Joi.string().max(80).optional(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  costPrice: Joi.number().positive().precision(2).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  retailPrice: Joi.number().positive().precision(2).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  liquidationPrice: Joi.number().positive().precision(2).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  reorderPoint: Joi.number().integer().min(0).default(0)
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
});

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const createProductSchema = Joi.object({
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  name: Joi.string().min(2).max(160).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  description: Joi.string().max(1000).allow("", null),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  category: Joi.string().max(80).allow("", null),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  baseUnit: Joi.string().min(1).max(20).required(),
  // Түсіндірме: Кіріс деректерін Joi схемасы арқылы тексереді.
  variants: Joi.array().items(variantSchema).min(1).required()
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
});

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = { createProductSchema };
