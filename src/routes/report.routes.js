const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const rbac = require("../middleware/rbac");
const controller = require("../controllers/report.controller");

const router = express.Router();

router.get("/valuation", rbac("SUPER_ADMIN", "TENANT_ADMIN", "ANALYST"), asyncHandler(controller.valuation));
router.get("/turnover", rbac("SUPER_ADMIN", "TENANT_ADMIN", "ANALYST"), asyncHandler(controller.turnover));
router.get("/dead-stock", rbac("SUPER_ADMIN", "TENANT_ADMIN", "ANALYST"), asyncHandler(controller.deadStock));

module.exports = router;
