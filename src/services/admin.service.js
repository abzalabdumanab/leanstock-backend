const { prisma } = require("../config/database");
const { pagePagination, buildPageMeta } = require("../utils/pagination");
const ApiError = require("../utils/ApiError");

async function listTenants(query) {
  const { page, limit, skip } = pagePagination(query);
  const [total, data] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.findMany({
      include: { _count: { select: { users: true, products: true, warehouses: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  return { data, pagination: buildPageMeta(total, page, limit) };
}

async function createTenant(body) {
  return prisma.tenant.create({ data: { name: body.name } });
}

async function suspendTenant(id) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new ApiError(404, "Tenant not found");
  return prisma.tenant.update({ where: { id }, data: { isActive: false } });
}

module.exports = { listTenants, createTenant, suspendTenant };
