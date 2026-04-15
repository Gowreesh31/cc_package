import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { SKUData, ShipmentData, ForecastData } from '../types';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  trend: 'up' | 'down';
  color: string;
}

export const StatsCard = ({ title, value, change, icon: Icon, trend, color }: StatsCardProps) => (
  <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl card-gradient relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-5 blur-2xl rounded-full -mr-12 -mt-12", color)}></div>
    
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50", color.replace('bg-', 'text-'))}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
        trend === 'up' ? "text-green-400 bg-green-400/10 border-green-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"
      )}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(change)}%
      </div>
    </div>
    
    <div>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight font-mono">{value}</h3>
    </div>
  </div>
);

export const StockForecastChart = ({ data }: { data: ForecastData[] }) => (
  <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient h-[400px] flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">30-Day Predictive Forecasting</h3>
        <p className="text-xs text-neutral-500 mt-1">SageMaker Prophet Model Output (SKU-001)</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/50"></div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase">Predicted</span>
        </div>
      </div>
    </div>
    
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(str) => str.split('-')[2]}
          />
          <YAxis 
            stroke="#525252" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#FAFAFA' }}
          />
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#3B82F6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorActual)" 
          />
          <Area 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3B82F6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const InventoryStatus = ({ data }: { data: SKUData[] }) => (
  <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
    <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inventory Health Matrix</h3>
      <button className="text-neutral-500 hover:text-white transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-neutral-950/50">
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">SKU ID</th>
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Warehouse</th>
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Stock</th>
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Reorder Pt</th>
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Predicted Stockout Days</th>
            <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Stock Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {data.map((item) => (
            <tr key={item.sku} className="hover:bg-white/5 transition-colors group cursor-pointer">
              <td className="px-5 py-4 text-xs font-mono font-medium text-blue-400">{item.sku}</td>
              <td className="px-5 py-4 text-xs text-neutral-400">{item.warehouse}</td>
              <td className="px-5 py-4 text-xs text-right font-mono text-white">{item.currentStock}</td>
              <td className="px-5 py-4 text-xs text-right font-mono text-neutral-500">{item.reorderPoint}</td>
              <td className="px-5 py-4 text-center">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  item.predictedStockoutDays <= 7 ? "text-red-400 bg-red-400/10" : 
                  item.predictedStockoutDays <= 14 ? "text-orange-400 bg-orange-400/10" : "text-green-400 bg-green-400/10"
                )}>
                  {item.predictedStockoutDays} Days
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    item.status === 'OPTIMAL' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                    item.status === 'WARNING' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  )}></div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    item.status === 'OPTIMAL' ? "text-green-500" :
                    item.status === 'WARNING' ? "text-orange-500" : "text-red-500"
                  )}>
                    {item.status}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const StockoutRiskHeatmap = ({ data }: { data: SKUData[] }) => {
  const warehouses = Array.from(new Set(data.map(d => d.warehouse))).sort();
  const skus = Array.from(new Set(data.map(d => d.sku))).sort();

  const getRiskColor = (sku: string, warehouse: string) => {
    const item = data.find(d => d.sku === sku && d.warehouse === warehouse);
    if (!item) return 'bg-neutral-950';
    if (item.status === 'CRITICAL') return 'bg-red-500/40 border-red-500/50 shadow-[inset_0_0_12px_rgba(239,68,68,0.2)]';
    if (item.status === 'WARNING') return 'bg-orange-500/30 border-orange-500/40 shadow-[inset_0_0_12px_rgba(249,115,22,0.1)]';
    return 'bg-emerald-500/20 border-emerald-500/30';
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Stockout Risk Heatmap</h3>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">Warehouse vs SKU Distribution</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[9px] font-bold text-neutral-500 uppercase">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-[9px] font-bold text-neutral-500 uppercase">Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[9px] font-bold text-neutral-500 uppercase">Low</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[400px]">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div className="h-8"></div>
            <div className="flex gap-2">
              {skus.map(sku => (
                <div key={sku} className="flex-1 text-[9px] font-mono text-neutral-500 text-center uppercase truncate" title={sku}>
                  {sku.split('-')[1]}
                </div>
              ))}
            </div>
            
            {warehouses.map(wh => (
              <React.Fragment key={wh}>
                <div className="text-[10px] font-bold text-neutral-400 flex items-center uppercase tracking-tighter">
                  {wh}
                </div>
                <div className="flex gap-2">
                  {skus.map(sku => (
                    <div 
                      key={`${wh}-${sku}`} 
                      className={cn(
                        "flex-1 h-8 rounded border transition-all hover:scale-105 cursor-help",
                        getRiskColor(sku, wh)
                      )}
                      title={`${sku} at ${wh}: ${data.find(d => d.sku === sku && d.warehouse === wh)?.status || 'No Data'}`}
                    ></div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Dataset: StockoutRiskAnalysis</span>
        <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Last Sync: 2m ago</span>
      </div>
    </div>
  );
};

export const ShipmentsMap = ({ data }: { data: ShipmentData[] }) => (
  <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-xl card-gradient flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Logistics Stream</h3>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        <span className="text-[10px] font-bold text-neutral-400 uppercase">Live S3 Ingestion</span>
      </div>
    </div>
    
    <div className="space-y-4">
      {data.map((shipment) => (
        <div key={shipment.id} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-950/50 border border-neutral-800 hover:border-neutral-700 transition-all group">
          <div className={cn(
            "p-2 rounded-md",
            shipment.status === 'IN_TRANSIT' ? "bg-blue-500/10 text-blue-400" :
            shipment.status === 'DELAYED' ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
          )}>
            <Truck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white font-mono">{shipment.id}</span>
              <span className="text-[10px] text-neutral-500">{shipment.eta}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span className="truncate">{shipment.origin}</span>
              <ArrowUpRight className="w-3 h-3 text-neutral-600" />
              <span className="truncate">{shipment.destination}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-white">{shipment.quantity}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">Units</p>
          </div>
        </div>
      ))}
    </div>
    
    <button className="mt-6 w-full py-2 border border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-500 uppercase tracking-widest hover:bg-white/5 transition-colors">
      View All Shipments
    </button>
  </div>
);
