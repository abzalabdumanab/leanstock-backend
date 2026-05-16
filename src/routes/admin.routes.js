const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const rbac = require("../middleware/rbac");
const controller = require("../controllers/admin.controller");
const { tenantSchema } = require("../validators/admin.validator");

const router = express.Router();

router.get("/tenants", rbac("SUPER_ADMIN"), asyncHandler(controller.listTenants));
router.post("/tenants", rbac("SUPER_ADMIN"), validate(tenantSchema), asyncHandler(controller.createTenant));
router.post("/tenants/:id/suspend", rbac("SUPER_ADMIN"), asyncHandler(controller.suspendTenant));
router.get("/audit-logs", rbac("SUPER_ADMIN", "TENANT_ADMIN"), asyncHandler(controller.auditLogs));
router.get("/queue/email", rbac("SUPER_ADMIN", "TENANT_ADMIN"), asyncHandler(controller.queueStats));
router.post("/queue/email/process-one", rbac("SUPER_ADMIN", "TENANT_ADMIN"), asyncHandler(controller.processEmailJob));
router.post("/jobs/dead-stock-decay/run", rbac("SUPER_ADMIN", "TENANT_ADMIN"), asyncHandler(controller.runDeadStock));

module.exports = router;
