const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const rbac = require("../middleware/rbac");
const controller = require("../controllers/adjustment.controller");
const { adjustmentSchema } = require("../validators/adjustment.validator");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), validate(adjustmentSchema), asyncHandler(controller.create));

module.exports = router;
