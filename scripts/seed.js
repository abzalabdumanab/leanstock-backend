const bcrypt = require("bcryptjs");
const { prisma } = require("../src/config/database");

async function upsertUser({ tenantId, email, passwordHash, role }) {
  return prisma.user.upsert({
    where: { email },
    update: { tenantId, passwordHash, role, isActive: true, emailVerifiedAt: new Date() },
    create: { tenantId, email, passwordHash, role, emailVerifiedAt: new Date() }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant-arzan" },
    update: { name: "Arzan Shop", isActive: true },
    create: { id: "seed-tenant-arzan", name: "Arzan Shop" }
  });

  await upsertUser({ tenantId: tenant.id, email: "super@arzan.kz", passwordHash, role: "SUPER_ADMIN" });
  await upsertUser({ tenantId: tenant.id, email: "admin@arzan.kz", passwordHash, role: "TENANT_ADMIN" });
  await upsertUser({ tenantId: tenant.id, email: "manager@arzan.kz", passwordHash, role: "WAREHOUSE_MANAGER" });
  await upsertUser({ tenantId: tenant.id, email: "analyst@arzan.kz", passwordHash, role: "ANALYST" });

  const source = await prisma.warehouse.upsert({
    where: { id: "seed-wh-main" },
    update: { tenantId: tenant.id, name: "Main Warehouse", address: "Almaty, Zhandosov 55", isActive: true },
    create: { id: "seed-wh-main", tenantId: tenant.id, name: "Main Warehouse", address: "Almaty, Zhandosov 55" }
  });

  const destination = await prisma.warehouse.upsert({
    where: { id: "seed-wh-mega" },
    update: { tenantId: tenant.id, name: "Mega Mall Store", address: "Almaty, Rozybakiev 247A", isActive: true },
    create: { id: "seed-wh-mega", tenantId: tenant.id, name: "Mega Mall Store", address: "Almaty, Rozybakiev 247A" }
  });

  const product = await prisma.product.upsert({
    where: { id: "seed-product-shoe" },
    update: {
      tenantId: tenant.id,
      name: "Urban Classic Sneakers",
      description: "Leather city sneakers",
      category: "Footwear",
      baseUnit: "pcs",
      isActive: true
    },
    create: {
      id: "seed-product-shoe",
      tenantId: tenant.id,
      name: "Urban Classic Sneakers",
      description: "Leather city sneakers",
      category: "Footwear",
      baseUnit: "pcs"
    }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SHOE-BLK-42" } },
    update: {
      productId: product.id,
      barcode: "4601234567890",
      size: "42",
      color: "Black",
      material: "Leather",
      costPrice: 2500,
      retailPrice: 5990,
      currentPrice: 5990,
      liquidationPrice: 1500,
      reorderPoint: 10,
      lastSaleDate: new Date(Date.now() - 45 * 86400000)
    },
    create: {
      tenantId: tenant.id,
      productId: product.id,
      sku: "SHOE-BLK-42",
      barcode: "4601234567890",
      size: "42",
      color: "Black",
      material: "Leather",
      costPrice: 2500,
      retailPrice: 5990,
      currentPrice: 5990,
      liquidationPrice: 1500,
      reorderPoint: 10,
      lastSaleDate: new Date(Date.now() - 45 * 86400000)
    }
  });

  await prisma.stockEntry.upsert({
    where: {
      tenantId_variantId_warehouseId: {
        tenantId: tenant.id,
        variantId: variant.id,
        warehouseId: source.id
      }
    },
    update: { quantity: 100 },
    create: { tenantId: tenant.id, variantId: variant.id, warehouseId: source.id, quantity: 100 }
  });

  await prisma.stockEntry.upsert({
    where: {
      tenantId_variantId_warehouseId: {
        tenantId: tenant.id,
        variantId: variant.id,
        warehouseId: destination.id
      }
    },
    update: { quantity: 5 },
    create: { tenantId: tenant.id, variantId: variant.id, warehouseId: destination.id, quantity: 5 }
  });

  console.log("Seed complete");
  console.log("Super admin: super@arzan.kz / Password123!");
  console.log("Tenant admin: admin@arzan.kz / Password123!");
  console.log("Warehouse manager: manager@arzan.kz / Password123!");
  console.log("Analyst: analyst@arzan.kz / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
