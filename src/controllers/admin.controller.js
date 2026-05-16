const adminService = require("../services/admin.service");
const emailService = require("../services/email.service");
const auditService = require("../services/audit.service");
const deadStock = require("../jobs/deadStockDecay.job");

async function listTenants(req, res) {
  res.json(await adminService.listTenants(req.query));
}

async function createTenant(req, res) {
  const tenant = await adminService.createTenant(req.body);
  await auditService.safeRecordAudit({
    tenantId: tenant.id,
    actorId: req.user.id,
    action: "TENANT_CREATED",
    entity: "Tenant",
    entityId: tenant.id,
    metadata: { name: tenant.name }
  });
  res.status(201).json(tenant);
}

async function suspendTenant(req, res) {
  const tenant = await adminService.suspendTenant(req.params.id);
  await auditService.safeRecordAudit({
    tenantId: tenant.id,
    actorId: req.user.id,
    action: "TENANT_SUSPENDED",
    entity: "Tenant",
    entityId: tenant.id,
    metadata: { name: tenant.name }
  });
  res.json(tenant);
}

async function auditLogs(req, res) {
  res.json(await auditService.listAuditLogs(req.user, req.query));
}

async function queueStats(req, res) {
  res.json(await emailService.queueStats(req.tenantId));
}

async function processEmailJob(_req, res) {
  const job = await emailService.processOneEmailJob();
  res.json({ processed: Boolean(job), job });
}

async function runDeadStock(_req, res) {
  const result = await deadStock.runOnce();
  res.json(result);
}

module.exports = { listTenants, createTenant, suspendTenant, auditLogs, queueStats, processEmailJob, runDeadStock };
