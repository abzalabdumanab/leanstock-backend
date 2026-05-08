const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const rbac = require("../middleware/rbac");
const controller = require("../controllers/stock.controller");
const { upsertStockSchema, reserveStockSchema } = require("../validators/stock.validator");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), validate(upsertStockSchema), asyncHandler(controller.upsert));
router.post("/reserve", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), validate(reserveStockSchema), asyncHandler(controller.reserve));

module.exports = router;
