import React from 'react';
import { 
  BarChart3, 
  Box, 
  Truck, 
  AlertTriangle, 
  Settings, 
  LayoutDashboard,
  Database,
  Search,
  Bell,
  User,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full transition-all duration-200 group",
      active 
        ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-500" 
        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "group-hover:text-neutral-300")} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export const Sidebar = ({ user, activePage, onPageChange }: { user: any, activePage: string, onPageChange: (page: string) => void }) => {
  return (
    <aside className="w-64 h-screen border-r border-neutral-800 bg-neutral-950 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Box className="text-white w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-white">SMART SUPPLY</h1>
      </div>

      <nav className="flex-1 mt-4">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-2">Main Menu</p>
        </div>
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={activePage === 'dashboard'} 
          onClick={() => onPageChange('dashboard')} 
        />
        <SidebarItem 
          icon={Box} 
          label="Inventory" 
          active={activePage === 'inventory'} 
          onClick={() => onPageChange('inventory')} 
        />
        <SidebarItem 
          icon={Truck} 
          label="Shipments" 
          active={activePage === 'shipments'} 
          onClick={() => onPageChange('shipments')} 
        />
        <SidebarItem 
          icon={BarChart3} 
          label="Forecasting" 
          active={activePage === 'forecasting'} 
          onClick={() => onPageChange('forecasting')} 
        />
        <SidebarItem 
          icon={Database} 
          label="Data Lake" 
          active={activePage === 'datalake'} 
          onClick={() => onPageChange('datalake')} 
        />
        
        <div className="px-4 mt-8 mb-4">
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-2">System</p>
        </div>
        <SidebarItem 
          icon={AlertTriangle} 
          label="Alerts" 
          active={activePage === 'alerts'} 
          onClick={() => onPageChange('alerts')} 
        />
        <SidebarItem 
          icon={Settings} 
          label="Settings" 
          active={activePage === 'settings'} 
          onClick={() => onPageChange('settings')} 
        />
        <SidebarItem
          icon={ShieldCheck}
          label="Audit Logs"
          active={activePage === 'audit'}
          onClick={() => onPageChange('audit')}
        />
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
            <User className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email || 'Guest'}</p>
            <p className="text-[10px] text-neutral-500 truncate uppercase tracking-tighter">{user?.role || 'Viewer'} Access</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const Header = () => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 bg-neutral-900/50 border border-neutral-800 px-3 py-1.5 rounded-md w-96">
        <Search className="w-4 h-4 text-neutral-500" />
        <input 
          type="text" 
          placeholder="Search SKUs, Shipments, or Logs..." 
          className="bg-transparent border-none outline-none text-sm text-neutral-300 w-full placeholder:text-neutral-600"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-neutral-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-neutral-950"></span>
        </button>
        <div className="h-6 w-px bg-neutral-800"></div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">AWS Status</span>
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              Operational
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
