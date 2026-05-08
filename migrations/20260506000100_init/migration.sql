CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'WAREHOUSE_MANAGER', 'ANALYST');
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'REJECTED');

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'TENANT_ADMIN',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevokedRefreshToken" (
  "id" TEXT NOT NULL,
  "jti" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RevokedRefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "baseUnit" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT,
  "size" TEXT,
  "color" TEXT,
  "material" TEXT,
  "costPrice" DECIMAL(12,2) NOT NULL,
  "retailPrice" DECIMAL(12,2) NOT NULL,
  "currentPrice" DECIMAL(12,2) NOT NULL,
  "liquidationPrice" DECIMAL(12,2) NOT NULL,
  "reorderPoint" INTEGER NOT NULL DEFAULT 0,
  "lastSaleDate" TIMESTAMP(3),
  "lastDecayAppliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warehouse" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockEntry" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockEntry_quantity_non_negative" CHECK ("quantity" >= 0)
);

CREATE TABLE "Transfer" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "destinationId" TEXT NOT NULL,
  "status" "TransferStatus" NOT NULL DEFAULT 'IN_TRANSIT',
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransferItem" (
  "id" TEXT NOT NULL,
  "transferId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "TransferItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TransferItem_quantity_positive" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RevokedRefreshToken_jti_key" ON "RevokedRefreshToken"("jti");
CREATE UNIQUE INDEX "ProductVariant_tenantId_sku_key" ON "ProductVariant"("tenantId", "sku");
CREATE UNIQUE INDEX "StockEntry_tenantId_variantId_warehouseId_key" ON "StockEntry"("tenantId", "variantId", "warehouseId");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "RevokedRefreshToken_userId_idx" ON "RevokedRefreshToken"("userId");
CREATE INDEX "RevokedRefreshToken_expiresAt_idx" ON "RevokedRefreshToken"("expiresAt");
CREATE INDEX "Product_tenantId_isActive_idx" ON "Product"("tenantId", "isActive");
CREATE INDEX "Product_tenantId_category_idx" ON "Product"("tenantId", "category");
CREATE INDEX "ProductVariant_tenantId_productId_idx" ON "ProductVariant"("tenantId", "productId");
CREATE INDEX "Warehouse_tenantId_isActive_idx" ON "Warehouse"("tenantId", "isActive");
CREATE INDEX "StockEntry_tenantId_warehouseId_idx" ON "StockEntry"("tenantId", "warehouseId");
CREATE INDEX "StockEntry_tenantId_variantId_idx" ON "StockEntry"("tenantId", "variantId");
CREATE INDEX "Transfer_tenantId_status_idx" ON "Transfer"("tenantId", "status");
CREATE INDEX "Transfer_tenantId_sourceId_idx" ON "Transfer"("tenantId", "sourceId");
CREATE INDEX "Transfer_tenantId_destinationId_idx" ON "Transfer"("tenantId", "destinationId");
CREATE INDEX "TransferItem_tenantId_variantId_idx" ON "TransferItem"("tenantId", "variantId");

ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
