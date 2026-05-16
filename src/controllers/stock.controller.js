const service = require("../services/stock.service");
const { safeRecordAudit } = require("../services/audit.service");

async function list(req, res) {
  res.json(await service.listStock(req.tenantId, req.query));
}

async function upsert(req, res) {
  const stock = await service.upsertStock(req.tenantId, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "STOCK_UPSERTED",
    entity: "StockEntry",
    entityId: stock.id,
    metadata: {
      warehouseId: stock.warehouseId,
      variantId: stock.variantId,
      quantity: stock.quantity
    }
  });
  res.status(201).json(stock);
}

async function reserve(req, res) {
  const reservation = await service.reserveStock(req.tenantId, req.user, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "STOCK_RESERVED",
    entity: "StockReservation",
    entityId: reservation.id,
    metadata: {
      warehouseId: reservation.warehouseId,
      variantId: reservation.variantId,
      quantity: reservation.quantity
    }
  });
  res.status(201).json(reservation);
}

module.exports = { list, upsert, reserve };
