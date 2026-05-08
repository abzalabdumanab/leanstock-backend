const adminService = require("../services/admin.service");
const emailService = require("../services/email.service");
const deadStock = require("../jobs/deadStockDecay.job");

async function listTenants(req, res) {
  res.json(await adminService.listTenants(req.query));
}

async function createTenant(req, res) {
  res.status(201).json(await adminService.createTenant(req.body));
}

async function suspendTenant(req, res) {
  res.json(await adminService.suspendTenant(req.params.id));
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

module.exports = { listTenants, createTenant, suspendTenant, queueStats, processEmailJob, runDeadStock };
