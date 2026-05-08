const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const rbac = require("../middleware/rbac");
const controller = require("../controllers/supplier.controller");
const { supplierSchema, updateSupplierSchema } = require("../validators/supplier.validator");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.post("/", rbac("SUPER_ADMIN", "TENANT_ADMIN"), validate(supplierSchema), asyncHandler(controller.create));
router.patch("/:id", rbac("SUPER_ADMIN", "TENANT_ADMIN"), validate(updateSupplierSchema), asyncHandler(controller.update));

module.exports = router;
