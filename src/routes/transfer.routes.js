// Түсіндірме: express модулін осы файлда қолдану үшін жүктейді.
const express = require("express");
// Түсіндірме: asyncHandler модулін осы файлда қолдану үшін жүктейді.
const asyncHandler = require("../utils/asyncHandler");
// Түсіндірме: validate модулін осы файлда қолдану үшін жүктейді.
const validate = require("../middleware/validate");
// Түсіндірме: rbac модулін осы файлда қолдану үшін жүктейді.
const rbac = require("../middleware/rbac");
// Түсіндірме: controller модулін осы файлда қолдану үшін жүктейді.
const controller = require("../controllers/transfer.controller");
// Түсіндірме: { createTransferSchema } модулін осы файлда қолдану үшін жүктейді.
const { createTransferSchema } = require("../validators/transfer.validator");

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const router = express.Router();

// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.get("/", asyncHandler(controller.list));
// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.post("/", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), validate(createTransferSchema), asyncHandler(controller.create));
// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.post("/:id/confirm", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), asyncHandler(controller.confirm));
// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.post("/:id/reject", rbac("SUPER_ADMIN", "TENANT_ADMIN", "WAREHOUSE_MANAGER"), asyncHandler(controller.reject));

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = router;
