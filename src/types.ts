export interface SKUData {
  sku: string;
  currentStock: number;
  reorderPoint: number;
  predictedStockoutDays: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  warehouse: string;
}

export interface ShipmentData {
  id: string;
  sku: string;
  origin: string;
  destination: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED';
  eta: string;
  quantity: number;
}

export interface ForecastData {
  date: string;
  actual: number;
  predicted: number;
}

export interface Alert {
  id: string;
  type: 'STOCKOUT' | 'DELAY' | 'SUPPLIER';
  message: string;
  timestamp: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AuditLogEntry {
  id: string;
  userEmail?: string | null;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}
