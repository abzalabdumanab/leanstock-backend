const { prisma } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { pagePagination, buildPageMeta } = require("../utils/pagination");
const { enqueueEmail } = require("./email.service");

async function listAdjustments(tenantId, query) {
  const { page, limit, skip } = pagePagination(query);
  const where = { tenantId, ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}) };
  const [total, data] = await Promise.all([
    prisma.adjustment.count({ where }),
    prisma.adjustment.findMany({
      where,
      include: { items: true, warehouse: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })
  ]);
  return { data, pagination: buildPageMeta(total, page, limit) };
}

async function createAdjustment(tenantId, user, body) {
  const warehouse = await prisma.warehouse.findFirst({ where: { id: body.warehouseId, tenantId, isActive: true } });
  if (!warehouse) throw new ApiError(404, "Warehouse not found");

  const adjustment = await prisma.$transaction(async (tx) => {
    const created = await tx.adjustment.create({
      data: {
        tenantId,
        warehouseId: body.warehouseId,
        reason: body.reason,
        note: body.note,
        createdById: user.id
      }
    });

    const items = [];
    for (const item of body.items) {
      const variant = await tx.productVariant.findFirst({ where: { id: item.variantId, tenantId } });
      if (!variant) throw new ApiError(404, `Variant ${item.variantId} not found`);

      const stock = await tx.stockEntry.upsert({
        where: { tenantId_variantId_warehouseId: { tenantId, variantId: item.variantId, warehouseId: body.warehouseId } },
        update: { quantity: { increment: item.delta } },
        create: { tenantId, variantId: item.variantId, warehouseId: body.warehouseId, quantity: item.delta }
      });

      if (stock.quantity < 0) {
        throw new ApiError(409, `Adjustment would make stock negative for variant ${item.variantId}`);
      }

      items.push(await tx.adjustmentItem.create({
        data: {
          adjustmentId: created.id,
          tenantId,
          variantId: item.variantId,
          delta: item.delta,
          quantityAfter: stock.quantity
        }
      }));
    }

    return tx.adjustment.findUnique({ where: { id: created.id }, include: { items: true, warehouse: true } });
  });

  await enqueueEmail({
    tenantId,
    to: user.email,
    subject: "LeanStock inventory adjustment recorded",
    template: "ADJUSTMENT_CREATED",
    payload: {
      heading: "Inventory adjustment recorded",
      message: `${adjustment.items.length} stock line(s) were adjusted for ${warehouse.name}.`
    }
  });

  return adjustment;
}

module.exports = { listAdjustments, createAdjustment };
