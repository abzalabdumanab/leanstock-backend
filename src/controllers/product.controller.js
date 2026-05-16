const service = require("../services/product.service");
const { safeRecordAudit } = require("../services/audit.service");

async function list(req, res) {
  res.json(await service.listProducts(req.tenantId, req.query));
}

async function create(req, res) {
  const product = await service.createProduct(req.tenantId, req.body);
  await safeRecordAudit({
    tenantId: req.tenantId,
    actorId: req.user.id,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    metadata: { name: product.name, variantCount: product.variants?.length || 0 }
  });
  res.status(201).json(product);
}

async function get(req, res) {
  res.json(await service.getProduct(req.tenantId, req.params.id));
}

module.exports = { list, create, get };
