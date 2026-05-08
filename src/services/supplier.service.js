const { prisma } = require("../config/database");
const { pagePagination, buildPageMeta } = require("../utils/pagination");
const ApiError = require("../utils/ApiError");
const { enqueueEmail } = require("./email.service");

async function listSuppliers(tenantId, query) {
  const { page, limit, skip } = pagePagination(query);
  const where = { tenantId, ...(query.active === "false" ? {} : { isActive: true }) };
  const [total, data] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit })
  ]);
  return { data, pagination: buildPageMeta(total, page, limit) };
}

async function createSupplier(tenantId, user, body) {
  const supplier = await prisma.supplier.create({ data: { tenantId, ...body } });
  await enqueueEmail({
    tenantId,
    to: user.email,
    subject: "LeanStock supplier created",
    template: "SUPPLIER_CREATED",
    payload: {
      heading: "Supplier created",
      message: `${supplier.name} was added to the supplier directory.`
    }
  });
  return supplier;
}

async function updateSupplier(tenantId, id, body) {
  const supplier = await prisma.supplier.findFirst({ where: { id, tenantId } });
  if (!supplier) throw new ApiError(404, "Supplier not found");
  return prisma.supplier.update({ where: { id }, data: body });
}

module.exports = { listSuppliers, createSupplier, updateSupplier };
