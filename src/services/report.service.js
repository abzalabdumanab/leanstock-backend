const { prisma } = require("../config/database");
const env = require("../config/env");

function toNumber(value) {
  return Number(value?.toString?.() || value || 0);
}

async function valuation(tenantId) {
  const entries = await prisma.stockEntry.findMany({
    where: { tenantId },
    include: { variant: { include: { product: true } }, warehouse: true }
  });

  const data = entries.map((entry) => ({
    warehouseId: entry.warehouseId,
    warehouseName: entry.warehouse.name,
    variantId: entry.variantId,
    sku: entry.variant.sku,
    productName: entry.variant.product.name,
    quantity: entry.quantity,
    costValue: (entry.quantity * toNumber(entry.variant.costPrice)).toFixed(2),
    retailValue: (entry.quantity * toNumber(entry.variant.currentPrice)).toFixed(2)
  }));

  const totals = data.reduce((acc, row) => ({
    quantity: acc.quantity + row.quantity,
    costValue: acc.costValue + Number(row.costValue),
    retailValue: acc.retailValue + Number(row.retailValue)
  }), { quantity: 0, costValue: 0, retailValue: 0 });

  return { data, totals: { ...totals, costValue: totals.costValue.toFixed(2), retailValue: totals.retailValue.toFixed(2) } };
}

async function turnover(tenantId) {
  const variants = await prisma.productVariant.findMany({
    where: { tenantId },
    include: { stockEntries: true, product: true }
  });

  return {
    data: variants.map((variant) => {
      const quantity = variant.stockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      const daysSinceSale = variant.lastSaleDate
        ? Math.floor((Date.now() - variant.lastSaleDate.getTime()) / 86400000)
        : null;
      const risk = daysSinceSale === null ? "UNKNOWN" : daysSinceSale >= env.deadStock.afterDays ? "SLOW" : "HEALTHY";
      return {
        variantId: variant.id,
        sku: variant.sku,
        productName: variant.product.name,
        quantity,
        daysSinceSale,
        risk
      };
    })
  };
}

async function deadStock(tenantId) {
  const cutoff = new Date(Date.now() - env.deadStock.afterDays * 86400000);
  const variants = await prisma.productVariant.findMany({
    where: {
      tenantId,
      OR: [{ lastSaleDate: null }, { lastSaleDate: { lt: cutoff } }]
    },
    include: { product: true, stockEntries: true }
  });

  return {
    data: variants.map((variant) => ({
      variantId: variant.id,
      sku: variant.sku,
      productName: variant.product.name,
      quantity: variant.stockEntries.reduce((sum, entry) => sum + entry.quantity, 0),
      currentPrice: variant.currentPrice.toString(),
      liquidationPrice: variant.liquidationPrice.toString(),
      lastSaleDate: variant.lastSaleDate,
      recommendedPrice: Math.max(
        toNumber(variant.liquidationPrice),
        toNumber(variant.currentPrice) * (1 - env.deadStock.decayPercent / 100)
      ).toFixed(2)
    }))
  };
}

module.exports = { valuation, turnover, deadStock };
