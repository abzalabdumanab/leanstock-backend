const service = require("../services/warehouse.service");
const { safeRecordAudit } = require("../services/audit.service");

async function list(req, res) {
  res.json({ data: await service.listWarehouses(req.tenantId) });
}

async function create(req, res) {
  const warehouse = await service.createWarehouse(req.tenantId, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "WAREHOUSE_CREATED",
    entity: "Warehouse",
    entityId: warehouse.id,
    metadata: { name: warehouse.name }
  });
  res.status(201).json(warehouse);
}

module.exports = { list, create };
