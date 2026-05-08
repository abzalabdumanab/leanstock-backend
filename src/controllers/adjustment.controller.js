const service = require("../services/adjustment.service");

async function list(req, res) {
  res.json(await service.listAdjustments(req.tenantId, req.query));
}

async function create(req, res) {
  res.status(201).json(await service.createAdjustment(req.tenantId, req.user, req.body));
}

module.exports = { list, create };
