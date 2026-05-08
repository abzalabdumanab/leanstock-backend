const { prisma } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { pagePagination, buildPageMeta } = require("../utils/pagination");
const { enqueueEmail } = require("./email.service");

function serializeStock(entry) {
  return {
    ...entry,
    variant: entry.variant ? {
      ...entry.variant,
      costPrice: entry.variant.costPrice.toString(),
      retailPrice: entry.variant.retailPrice.toString(),
      currentPrice: entry.variant.currentPrice.toString(),
      liquidationPrice: entry.variant.liquidationPrice.toString()
    } : undefined
  };
}

async function availableQuantity(tenantId, variantId, warehouseId, client = prisma) {
  const stock = await client.stockEntry.findUnique({
    where: { tenantId_variantId_warehouseId: { tenantId, variantId, warehouseId } }
  });
  const reserved = await client.stockReservation.aggregate({
    where: {
      tenantId,
      variantId,
      warehouseId,
      releasedAt: null,
      expiresAt: { gt: new Date() }
    },
    _sum: { quantity: true }
  });

  return (stock?.quantity || 0) - (reserved._sum.quantity || 0);
}

async function listStock(tenantId, query) {
  const { page, limit, skip } = pagePagination(query);
  const where = {
    tenantId,
    ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
    ...(query.variantId ? { variantId: query.variantId } : {})
  };
  const [total, entries] = await Promise.all([
    prisma.stockEntry.count({ where }),
    prisma.stockEntry.findMany({
      where,
      include: { variant: true, warehouse: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit
    })
  ]);

  return { data: entries.map(serializeStock), pagination: buildPageMeta(total, page, limit) };
}

async function upsertStock(tenantId, body) {
  const variant = await prisma.productVariant.findFirst({ where: { id: body.variantId, tenantId } });
  if (!variant) throw new ApiError(404, `Variant with id ${body.variantId} not found`);

  const warehouse = await prisma.warehouse.findFirst({ where: { id: body.warehouseId, tenantId, isActive: true } });
  if (!warehouse) throw new ApiError(404, `Warehouse with id ${body.warehouseId} not found`);
  if (body.quantity < 0) throw new ApiError(409, "Stock quantity cannot be negative");

  const entry = await prisma.stockEntry.upsert({
    where: {
      tenantId_variantId_warehouseId: {
        tenantId,
        variantId: body.variantId,
        warehouseId: body.warehouseId
      }
    },
    update: { quantity: body.quantity },
    create: { tenantId, variantId: body.variantId, warehouseId: body.warehouseId, quantity: body.quantity },
    include: { variant: true, warehouse: true }
  });

  return serializeStock(entry);
}

async function reserveStock(tenantId, user, body) {
  const reservation = await prisma.$transaction(async (tx) => {
    const quantity = await availableQuantity(tenantId, body.variantId, body.warehouseId, tx);
    if (quantity < body.quantity) {
      throw new ApiError(409, `Only ${quantity} units are available for reservation`);
    }

    return tx.stockReservation.create({
      data: {
        tenantId,
        variantId: body.variantId,
        warehouseId: body.warehouseId,
        quantity: body.quantity,
        createdById: user.id,
        expiresAt: new Date(Date.now() + body.ttlSeconds * 1000)
      }
    });
  });

  await enqueueEmail({
    tenantId,
    to: user.email,
    subject: "LeanStock stock reservation created",
    template: "STOCK_RESERVED",
    payload: {
      heading: "Stock reservation created",
      message: `${reservation.quantity} unit(s) reserved until ${reservation.expiresAt.toISOString()}.`
    }
  });

  return reservation;
}

module.exports = { listStock, upsertStock, reserveStock, availableQuantity, serializeStock };
