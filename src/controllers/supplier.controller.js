const service = require("../services/supplier.service");

async function list(req, res) {
  res.json(await service.listSuppliers(req.tenantId, req.query));
}

async function create(req, res) {
  res.status(201).json(await service.createSupplier(req.tenantId, req.user, req.body));
}

async function update(req, res) {
  res.json(await service.updateSupplier(req.tenantId, req.params.id, req.body));
}

module.exports = { list, create, update };
