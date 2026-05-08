// Түсіндірме: express модулін осы файлда қолдану үшін жүктейді.
const express = require("express");
// Түсіндірме: asyncHandler модулін осы файлда қолдану үшін жүктейді.
const asyncHandler = require("../utils/asyncHandler");
// Түсіндірме: validate модулін осы файлда қолдану үшін жүктейді.
const validate = require("../middleware/validate");
// Түсіндірме: rbac модулін осы файлда қолдану үшін жүктейді.
const rbac = require("../middleware/rbac");
// Түсіндірме: controller модулін осы файлда қолдану үшін жүктейді.
const controller = require("../controllers/product.controller");
// Түсіндірме: { createProductSchema } модулін осы файлда қолдану үшін жүктейді.
const { createProductSchema } = require("../validators/product.validator");

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const router = express.Router();

// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.get("/", asyncHandler(controller.list));
// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.post("/", rbac("SUPER_ADMIN", "TENANT_ADMIN"), validate(createProductSchema), asyncHandler(controller.create));
// Түсіндірме: Express router-ге HTTP маршрутын тіркейді.
router.get("/:id", asyncHandler(controller.get));

// Түсіндірме: Бұл файлдан сыртқа берілетін функциялар мен мәндерді көрсетеді.
module.exports = router;
