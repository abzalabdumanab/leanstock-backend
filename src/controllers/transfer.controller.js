const service = require("../services/transfer.service");
const { safeRecordAudit } = require("../services/audit.service");

async function list(req, res) {
  res.json(await service.listTransfers(req.tenantId, req.query));
}

async function create(req, res) {
  const transfer = await service.createTransfer(req.tenantId, req.user.id, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "TRANSFER_CREATED",
    entity: "Transfer",
    entityId: transfer.id,
    metadata: {
      sourceId: transfer.sourceId,
      destinationId: transfer.destinationId,
      itemCount: transfer.items?.length || 0
    }
  });
  res.status(201).json(transfer);
}

async function confirm(req, res) {
  const transfer = await service.confirmTransfer(req.tenantId, req.params.id);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "TRANSFER_CONFIRMED",
    entity: "Transfer",
    entityId: transfer.id,
    metadata: { status: transfer.status }
  });
  res.json(transfer);
}

async function reject(req, res) {
  const transfer = await service.rejectTransfer(req.tenantId, req.params.id);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "TRANSFER_REJECTED",
    entity: "Transfer",
    entityId: transfer.id,
    metadata: { status: transfer.status }
  });
  res.json(transfer);
}

module.exports = { list, create, confirm, reject };
