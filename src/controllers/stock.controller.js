const service = require("../services/stock.service");

async function list(req, res) {
  res.json(await service.listStock(req.tenantId, req.query));
}

async function upsert(req, res) {
  res.status(201).json(await service.upsertStock(req.tenantId, req.body));
}

async function reserve(req, res) {
  res.status(201).json(await service.reserveStock(req.tenantId, req.user, req.body));
}

module.exports = { list, upsert, reserve };
