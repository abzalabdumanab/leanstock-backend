const service = require("../services/adjustment.service");
const { safeRecordAudit } = require("../services/audit.service");

async function list(req, res) {
  res.json(await service.listAdjustments(req.tenantId, req.query));
}

async function create(req, res) {
  const adjustment = await service.createAdjustment(req.tenantId, req.user, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "ADJUSTMENT_CREATED",
    entity: "Adjustment",
    entityId: adjustment.id,
    metadata: {
      warehouseId: adjustment.warehouseId,
      reason: adjustment.reason,
      itemCount: adjustment.items?.length || 0
    }
  });
  res.status(201).json(adjustment);
}

module.exports = { list, create };
