import React, { createContext, useContext, useEffect, useState } from "react";
import { Activity, Database, Lock, LogOut, Mail, ShieldCheck, Zap } from "lucide-react";
import { Sidebar, Header } from "./components/Layout";
import { StatsCard, StockForecastChart, InventoryStatus, ShipmentsMap, StockoutRiskHeatmap } from "./components/Dashboard";
import { InventoryView, ShipmentsView, ForecastingView, DataLakeView, AlertsView } from "./components/Views";
import { SKUData, ShipmentData, ForecastData, Alert, AuditLogEntry } from "./types";
import { AICopilot } from "./components/AICopilot";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "viewer";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  csrfToken: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setCsrfToken(data?.csrfToken ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "Invalid credentials");
    }
    const data = await res.json();
    setUser(data.user);
    setCsrfToken(data.csrfToken);
    toast.success(`Welcome back, ${data.user.name}`);
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Failed to generate reset token");
    return data.resetToken as string;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || "Failed to reset password");
  };

  const logout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
    });
    setUser(null);
    setCsrfToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, forgotPassword, resetPassword, logout, csrfToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const LoginPage = () => {
  const { login, forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");

  const onLogin = async () => login(email, password);
  const onForgot = async () => {
    const token = await forgotPassword(email);
    setGeneratedToken(token);
    setResetToken(token);
    toast.success("Reset token generated. Use it below.");
    setMode("reset");
  };
  const onReset = async () => {
    await resetPassword(resetToken, newPassword);
    toast.success("Password reset successful. You can log in now.");
    setMode("login");
    setPassword("");
    setNewPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "login") await onLogin();
      if (mode === "forgot") await onForgot();
      if (mode === "reset") await onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center p-4 technical-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-600" />
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <Lock className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Access</h1>
          <p className="text-xs text-neutral-500 mt-2 uppercase tracking-widest font-bold">Smart Supply Chain Node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@smartsupply.io" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-700 focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>

          {mode === "login" && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:border-blue-500 outline-none transition-all" />
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Reset Token</label>
                <input type="text" required value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">New Password</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:border-blue-500 outline-none transition-all" />
              </div>
            </>
          )}

          {generatedToken && mode === "reset" && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 break-all">
              Generated token: {generatedToken}
            </div>
          )}

          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-wider text-center">{error}</div>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 text-sm uppercase tracking-widest disabled:opacity-50">
            {isSubmitting ? "Processing..." : mode === "login" ? "Initialize Session" : mode === "forgot" ? "Generate Reset Token" : "Reset Password"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-800 text-center space-y-3">
          {mode !== "login" && <button className="text-[10px] text-neutral-500 uppercase tracking-wider hover:text-blue-400" onClick={() => setMode("login")}>Back to Login</button>}
          {mode === "login" && <button className="text-[10px] text-neutral-500 uppercase tracking-wider hover:text-blue-400" onClick={() => setMode("forgot")}>Forgot Password</button>}
        </div>
      </motion.div>
    </div>
  );
};

const DashboardContent = () => {
  const { user, logout, csrfToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [inventory, setInventory] = useState<SKUData[]>([]);
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const loadDashboardData = async () => {
    const res = await fetch("/api/dashboard-data");
    if (!res.ok) throw new Error("Failed to load dashboard data");
    const data = await res.json();
    setInventory(data.inventory || []);
    setShipments(data.shipments || []);
    setForecast(data.forecast || []);
    setAlerts(data.alerts || []);
  };

  const loadAuditLogs = async () => {
    if (user?.role !== "admin") return;
    const res = await fetch("/api/audit-logs");
    if (!res.ok) return;
    const data = await res.json();
    setAuditLogs(data.logs || []);
  };

  useEffect(() => {
    Promise.all([loadDashboardData(), loadAuditLogs()]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-neutral-950 flex flex-col items-center justify-center technical-grid">
        <div className="w-16 h-16 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8" />
        <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em] animate-pulse">Loading Platform Data</h2>
      </div>
    );
  }

  const invokeAdminAction = async (url: string) => {
    const res = await fetch(url, { method: "POST", headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || "Action completed.");
      await loadAuditLogs();
    } else toast.error(data?.error?.message || "Action failed");
  };

  const renderContent = () => {
    switch (activePage) {
      case "inventory":
        return <InventoryView data={inventory} />;
      case "shipments":
        return <ShipmentsView data={shipments} />;
      case "forecasting":
        return <ForecastingView data={forecast} />;
      case "datalake":
        return <DataLakeView />;
      case "alerts":
        return <AlertsView alerts={alerts} />;
      case "audit":
        return <AuditLogsView logs={auditLogs} />;
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Total Inventory Items" value={inventory.length} change={8.2} icon={Database} trend="up" color="bg-blue-500" />
              <StatsCard title="Active Shipments" value={shipments.length} change={-1.3} icon={Activity} trend="down" color="bg-emerald-500" />
              <StatsCard title="Critical Alerts" value={alerts.filter((a) => a.severity === "HIGH").length} change={10.5} icon={ShieldCheck} trend="up" color="bg-red-500" />
              <StatsCard title="Forecast Points" value={forecast.length} change={2.1} icon={Zap} trend="up" color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <StockForecastChart data={forecast} />
                <StockoutRiskHeatmap data={inventory} />
                <InventoryStatus data={inventory} />
              </div>
              <div className="space-y-6">
                <ShipmentsMap data={shipments} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 font-sans selection:bg-blue-500/30">
      <Sidebar user={user} activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 technical-grid">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {activePage === "dashboard" ? "Supply Chain Visibility" : activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">Operational dashboard with DB-backed metrics and auditable actions.</p>
              </div>
              <div className="flex items-center gap-3">
                {user?.role === "admin" ? (
                  <>
                    <button onClick={() => invokeAdminAction("/api/ingest")} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
                      <Database className="w-4 h-4 text-neutral-500" /> Ingest Data
                    </button>
                    <button onClick={() => invokeAdminAction("/api/run-etl")} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-white hover:bg-neutral-800 transition-all">
                      <Activity className="w-4 h-4 text-neutral-500" /> Run ETL
                    </button>
                    <button onClick={() => invokeAdminAction("/api/run-inference")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                      <Zap className="w-4 h-4" /> Run Inference
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                    Read-Only Access
                  </div>
                )}
                <button onClick={logout} className="p-2 text-neutral-500 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activePage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <AICopilot csrfToken={csrfToken} />
    </div>
  );
};

const AuditLogsView = ({ logs }: { logs: AuditLogEntry[] }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h2>
      <p className="text-sm text-neutral-500 mt-1">Security and operational event trail for compliance and debugging.</p>
    </div>
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="divide-y divide-neutral-800">
        {logs.map((log) => (
          <div key={log.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">{log.action}</p>
              <p className="text-[11px] text-neutral-500">{log.userEmail || "system"} {log.target ? `• ${log.target}` : ""}</p>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="p-6 text-sm text-neutral-500">No audit entries yet.</div>}
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" />
      <AuthWrapper />
    </AuthProvider>
  );
}

const AuthWrapper = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-neutral-950" />;
  return user ? <DashboardContent /> : <LoginPage />;
};
