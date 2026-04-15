import React from 'react';
import { 
  Package, 
  Truck, 
  BarChart3, 
  Database, 
  AlertTriangle, 
  AlertCircle,
  Bell,
  Clock,
  Filter, 
  Download, 
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Activity,
  Zap,
  ShieldCheck,
  Server
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SKUData, ShipmentData, ForecastData, Alert } from '../types';
import { 
  StatsCard, 
  StockForecastChart, 
  InventoryStatus, 
  ShipmentsMap, 
  StockoutRiskHeatmap 
} from './Dashboard';
import { motion } from 'motion/react';

// --- Inventory View ---
export const InventoryView = ({ data }: { data: SKUData[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Inventory Management</h2>
        <p className="text-sm text-neutral-500 mt-1">Real-time stock levels across all global warehouses.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
          <Filter className="w-4 h-4 text-neutral-500" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          Add SKU
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard title="Total SKUs" value={data.length} change={2.4} icon={Package} trend="up" color="bg-blue-500" />
      <StatsCard title="Out of Stock" value={data.filter(d => d.currentStock === 0).length} change={-1.2} icon={AlertTriangle} trend="down" color="bg-red-500" />
      <StatsCard title="Warehouse Utilization" value="84%" change={5.6} icon={Layers} trend="up" color="bg-emerald-500" />
    </div>

    <InventoryStatus data={data} />
  </motion.div>
);

// --- Shipments View ---
export const ShipmentsView = ({ data }: { data: ShipmentData[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Logistics & Shipments</h2>
        <p className="text-sm text-neutral-500 mt-1">Tracking active freight and supplier deliveries.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
          <Download className="w-4 h-4 text-neutral-500" />
          Export Manifest
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
          <Truck className="w-4 h-4" />
          New Shipment
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ShipmentsMap data={data} />
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Delivery Performance</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tighter">On-Time Delivery</p>
                <p className="text-[10px] text-neutral-500">Last 30 days</p>
              </div>
            </div>
            <span className="text-lg font-bold text-emerald-500">94.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tighter">Avg Transit Time</p>
                <p className="text-[10px] text-neutral-500">Global Average</p>
              </div>
            </div>
            <span className="text-lg font-bold text-blue-500">4.8d</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tighter">Delay Rate</p>
                <p className="text-[10px] text-neutral-500">Current Quarter</p>
              </div>
            </div>
            <span className="text-lg font-bold text-red-500">2.1%</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// --- Forecasting View ---
export const ForecastingView = ({ data }: { data: ForecastData[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Demand Forecasting</h2>
        <p className="text-sm text-neutral-500 mt-1">ML-driven predictions for future stock requirements.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
          <Calendar className="w-4 h-4 text-neutral-500" />
          Adjust Window
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
          <Zap className="w-4 h-4" />
          Recalculate Models
        </button>
      </div>
    </div>

    <StockForecastChart data={data} />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Model Confidence Scores</h3>
        <div className="space-y-4">
          {[
            { name: 'Prophet (Time Series)', score: 92, status: 'High' },
            { name: 'XGBoost (Regression)', score: 88, status: 'High' },
            { name: 'LSTM (Deep Learning)', score: 74, status: 'Medium' },
          ].map(model => (
            <div key={model.name} className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-neutral-400">{model.name}</span>
                <span className={cn(model.score > 80 ? "text-emerald-500" : "text-amber-500")}>{model.score}%</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", model.score > 80 ? "bg-emerald-500" : "bg-amber-500")} 
                  style={{ width: `${model.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Forecasting Insights</h3>
        <ul className="space-y-3">
          <li className="flex gap-3 text-xs text-neutral-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
            <span>Seasonal peak expected in **WH-NORTH** starting late April.</span>
          </li>
          <li className="flex gap-3 text-xs text-neutral-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
            <span>Supply chain lead times from **Supplier A** are trending down by 12%.</span>
          </li>
          <li className="flex gap-3 text-xs text-neutral-400">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
            <span>Recommended safety stock increase for **SKU-004** by 15 units.</span>
          </li>
        </ul>
      </div>
    </div>
  </motion.div>
);

// --- Data Lake View ---
export const DataLakeView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AWS Data Lake Explorer</h2>
        <p className="text-sm text-neutral-500 mt-1">Direct access to S3 buckets, Glue catalogs, and Athena queries.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
          <Search className="w-4 h-4 text-neutral-500" />
          SQL Query
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl card-gradient">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Server className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">S3 Buckets</h3>
        </div>
        <div className="space-y-2">
          {['raw-zone-supply', 'curated-zone-supply', 'analytics-output'].map(bucket => (
            <div key={bucket} className="flex items-center justify-between p-2 rounded bg-neutral-950/50 border border-neutral-800/50">
              <span className="text-[10px] font-mono text-neutral-400">s3://{bucket}</span>
              <span className="text-[9px] font-bold text-neutral-600 uppercase">Active</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl card-gradient">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Database className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Glue Catalog</h3>
        </div>
        <div className="space-y-2">
          {['inventory_table', 'shipments_table', 'forecast_results'].map(table => (
            <div key={table} className="flex items-center justify-between p-2 rounded bg-neutral-950/50 border border-neutral-800/50">
              <span className="text-[10px] font-mono text-neutral-400">{table}</span>
              <span className="text-[9px] font-bold text-neutral-600 uppercase">Schema OK</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl card-gradient">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">ETL Pipelines</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded bg-neutral-950/50 border border-neutral-800/50">
            <span className="text-[10px] font-mono text-neutral-400">DailyIngestJob</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Success</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-neutral-950/50 border border-neutral-800/50">
            <span className="text-[10px] font-mono text-neutral-400">SageMakerSync</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Success</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-neutral-950/50 border border-neutral-800/50">
            <span className="text-[10px] font-mono text-neutral-400">AthenaViewRefresh</span>
            <span className="text-[9px] font-bold text-blue-500 uppercase">Running</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-500" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Data Operations</h3>
        </div>
        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Last 24 Hours</span>
      </div>
      <div className="divide-y divide-neutral-800">
        {[
          { op: 'PUT', resource: 's3://raw-zone-supply/batch_20260325.csv', user: 'System', time: '12m ago' },
          { op: 'QUERY', resource: 'SELECT * FROM inventory_table LIMIT 100', user: 'admin@smartsupply.io', time: '45m ago' },
          { op: 'UPDATE', resource: 'Glue Partition: warehouse=WH-NORTH', user: 'ETL_Service', time: '2h ago' },
        ].map((log, i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                log.op === 'PUT' ? "text-blue-500 border-blue-500/20 bg-blue-500/10" :
                log.op === 'QUERY' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" : "text-amber-500 border-amber-500/20 bg-amber-500/10"
              )}>{log.op}</span>
              <span className="text-xs font-mono text-neutral-400 truncate max-w-md">{log.resource}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">{log.user}</span>
              <span className="text-[10px] text-neutral-600 font-mono">{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// --- Alerts View ---
export const AlertsView = ({ alerts }: { alerts: Alert[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Alerts & Notifications</h2>
        <p className="text-sm text-neutral-500 mt-1">Critical events requiring immediate operational attention.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
          Mark All Read
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white font-mono">{alerts.filter(a => a.severity === 'HIGH').length}</h3>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical Alerts</p>
        </div>
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white font-mono">{alerts.filter(a => a.severity === 'MEDIUM').length}</h3>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Warning Alerts</p>
        </div>
      </div>
      <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Bell className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white font-mono">{alerts.length}</h3>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Total Notifications</p>
        </div>
      </div>
    </div>

    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="divide-y divide-neutral-800">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              alert.severity === 'HIGH' ? "bg-red-500/10 text-red-500" :
              alert.severity === 'MEDIUM' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
            )}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{alert.type} ALERT</h4>
                <span className="text-[10px] text-neutral-500 font-mono">{alert.timestamp}</span>
              </div>
              <p className="text-sm text-neutral-400">{alert.message}</p>
              <div className="mt-4 flex items-center gap-3">
                <button className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">View Details</button>
                <button className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:underline">Dismiss</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);
