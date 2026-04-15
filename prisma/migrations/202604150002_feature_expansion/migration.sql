-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('OPTIMAL', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('IN_TRANSIT', 'DELAYED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('STOCKOUT', 'DELAY', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'LOGIN',
  'LOGOUT',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_COMPLETE',
  'INGEST',
  'RUN_ETL',
  'RUN_INFERENCE',
  'AI_CHAT',
  'AI_TOOL_CALL',
  'RESTOCK_TRIGGER'
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "currentStock" INTEGER NOT NULL,
  "reorderPoint" INTEGER NOT NULL,
  "predictedStockoutDays" INTEGER NOT NULL,
  "status" "InventoryStatus" NOT NULL,
  "warehouse" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "status" "ShipmentStatus" NOT NULL,
  "eta" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastPoint" (
  "id" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "actual" INTEGER NOT NULL,
  "predicted" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ForecastPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyAlert" (
  "id" TEXT NOT NULL,
  "type" "AlertType" NOT NULL,
  "message" TEXT NOT NULL,
  "timestamp" TEXT NOT NULL,
  "severity" "AlertSeverity" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "action" "AuditAction" NOT NULL,
  "target" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_externalId_key" ON "Shipment"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastPoint_date_key" ON "ForecastPoint"("date");

-- AddForeignKey
ALTER TABLE "PasswordResetToken"
ADD CONSTRAINT "PasswordResetToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
