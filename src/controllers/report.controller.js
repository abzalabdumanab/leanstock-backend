const service = require("../services/report.service");

async function valuation(req, res) {
  res.json(await service.valuation(req.tenantId));
}

async function turnover(req, res) {
  res.json(await service.turnover(req.tenantId));
}

async function deadStock(req, res) {
  res.json(await service.deadStock(req.tenantId));
}

module.exports = { valuation, turnover, deadStock };
