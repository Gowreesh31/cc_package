import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AlertSeverity,
  AlertType,
  InventoryStatus,
  PrismaClient,
  ShipmentStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "password";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const users = [
    {
      email: "admin@smartsupply.io",
      name: "Admin User",
      role: UserRole.admin,
    },
    {
      email: "viewer@smartsupply.io",
      name: "Viewer User",
      role: UserRole.viewer,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }

  const inventory = [
    { sku: "SKU-001", currentStock: 180, reorderPoint: 100, predictedStockoutDays: 5, status: InventoryStatus.CRITICAL, warehouse: "WH-NORTH" },
    { sku: "SKU-002", currentStock: 450, reorderPoint: 100, predictedStockoutDays: 24, status: InventoryStatus.OPTIMAL, warehouse: "WH-EAST" },
    { sku: "SKU-003", currentStock: 210, reorderPoint: 100, predictedStockoutDays: 12, status: InventoryStatus.WARNING, warehouse: "WH-WEST" },
    { sku: "SKU-004", currentStock: 85, reorderPoint: 100, predictedStockoutDays: 3, status: InventoryStatus.CRITICAL, warehouse: "WH-SOUTH" },
    { sku: "SKU-005", currentStock: 320, reorderPoint: 100, predictedStockoutDays: 18, status: InventoryStatus.OPTIMAL, warehouse: "WH-NORTH" },
  ];

  for (const item of inventory) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: item,
      create: item,
    });
  }

  const shipments = [
    { externalId: "SHP-9281", sku: "SKU-001", origin: "Supplier A", destination: "WH-NORTH", status: ShipmentStatus.IN_TRANSIT, eta: "2h 15m", quantity: 450 },
    { externalId: "SHP-9282", sku: "SKU-004", origin: "Supplier B", destination: "WH-SOUTH", status: ShipmentStatus.DELAYED, eta: "1d 4h", quantity: 200 },
    { externalId: "SHP-9283", sku: "SKU-003", origin: "Supplier C", destination: "WH-WEST", status: ShipmentStatus.DELIVERED, eta: "Completed", quantity: 150 },
  ];

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { externalId: shipment.externalId },
      update: shipment,
      create: shipment,
    });
  }

  const forecasts = [
    { date: "2026-03-01", actual: 450, predicted: 450 },
    { date: "2026-03-05", actual: 420, predicted: 425 },
    { date: "2026-03-10", actual: 380, predicted: 390 },
    { date: "2026-03-15", actual: 310, predicted: 320 },
    { date: "2026-03-20", actual: 250, predicted: 260 },
    { date: "2026-03-25", actual: 180, predicted: 195 },
    { date: "2026-03-30", actual: 120, predicted: 140 },
    { date: "2026-04-05", actual: 0, predicted: 85 },
    { date: "2026-04-10", actual: 0, predicted: 40 },
    { date: "2026-04-15", actual: 0, predicted: 10 },
  ];

  for (const point of forecasts) {
    await prisma.forecastPoint.upsert({
      where: { date: point.date },
      update: point,
      create: point,
    });
  }

  const alerts = [
    { type: AlertType.STOCKOUT, message: "SKU-001 predicted stockout in 5 days", timestamp: "10m ago", severity: AlertSeverity.HIGH },
    { type: AlertType.DELAY, message: "SHP-9282 delayed due to weather at port", timestamp: "45m ago", severity: AlertSeverity.MEDIUM },
  ];

  await prisma.supplyAlert.deleteMany({});
  await prisma.supplyAlert.createMany({ data: alerts });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error("Seed failed:", error);
    process.exit(1);
  });
