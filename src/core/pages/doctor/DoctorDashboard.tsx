import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { mockApi, QueuePatient } from "../../lib/mockData";
import { getRiskBg, getRiskDot, formatDate, formatTime } from "../../lib/voice";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Bell, LogOut, RefreshCw, Stethoscope, Activity, Users,
  ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle,
  X, Calendar, Loader2, Mic, Brain, BarChart3, MapPin, Microscope, Scan,
  Zap, FileImage
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { AICopilot } from "../../components/AICopilot";
import { supabase, realtime } from "../../lib/supabase";
import { DiagnosticsView, AnalyticsView } from "./DoctorDashboardViews";

interface QueueItem {
  id: string; patientId: string; patientName: string; patientAge: number | null;
  patientAllergies: string[]; patientMedications: string[]; patientConditions: string[];
  date: string; slot: string; reason: string; status: string;
  riskLevel: string | null; riskScore: number | null; aiSummary: string | null;
  criticalFlags: string[]; checkedIn: boolean;
}

const RISK_COLORS: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [riskFilter, setRiskFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"queue" | "diagnostics" | "analytics">("queue");

  useEffect(() => {
    if (!user || user.role !== "doctor") { navigate("/doctor/login"); return; }
  }, [user, navigate]);

  const loadQueue = useCallback(async () => {
    try {
      const rawQueue = mockApi.getDoctorQueue(user?.doctorId || "");
      // Map QueuePatient → QueueItem shape
      const mapped: QueueItem[] = rawQueue.map((q: QueuePatient) => ({
        id: q.id,
        patientId: q.patientId,
        patientName: q.name,
        patientAge: q.age,
        patientAllergies: [],
        patientMedications: [],
        patientConditions: [],
        date: new Date().toISOString().split("T")[0],
        slot: q.slot,
        reason: q.reason,
        status: q.checkedIn ? "Confirmed" : "Pending",
        riskLevel: q.riskLevel,
        riskScore: q.riskScore / 100,
        aiSummary: q.aiSummary,
        criticalFlags: q.symptoms,
        checkedIn: q.checkedIn,
      }));
      setQueue(mapped);
      setLastRefresh(new Date());
      setWsConnected(true);
    } catch (e: any) {
      console.error(e);
      setWsConnected(false);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    loadQueue();

    if (user?.doctorId) {
      const channel = realtime.watchDoctorQueue(user.doctorId, () => {
        console.log("🔔 Real-time update received!");
        loadQueue();
      });

      return () => {
        realtime.unsub(channel);
      };
    }
  }, [loadQueue, user?.doctorId]);

  const doAction = async (apptId: string, status: string) => {
    setActionLoading(apptId + status);
    // Update locally
    setQueue(q => q.map(item => item.id === apptId ? { ...item, status } : item));
    toast.success(`Appointment ${status.toLowerCase()}!`);
    setActionLoading(null);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const handleCopilotAction = (action: { type: string; value?: string }) => {
    if (action.type === "filter" && action.value === "HIGH") setRiskFilter("HIGH");
    else if (action.type === "filter" && action.value === "checkedIn") setRiskFilter("checkedIn");
    else if (action.type === "navigate" && action.value === "pending") setRiskFilter(null);
    else if (action.type === "navigate" && action.value === "refresh") loadQueue();
  };

  const riskCounts = {
    HIGH: queue.filter(q => q.riskLevel === "HIGH").length,
    MEDIUM: queue.filter(q => q.riskLevel === "MEDIUM").length,
    LOW: queue.filter(q => q.riskLevel === "LOW").length,
    None: queue.filter(q => !q.riskLevel).length,
  };
  const pieData = Object.entries(riskCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, color: RISK_COLORS[name] || "#9ca3af" }));

  if (!user) return null;

  const displayQueue = queue
    .filter(item => !riskFilter || item.riskLevel === riskFilter || (riskFilter === "checkedIn" && item.checkedIn))
    .sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2, null: 3 };
      return (riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 3) - (riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 3);
    });

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 text-zinc-400 font-medium">
      {/* 🧭 NAVIGATION */}
      <nav className="bg-[#050505]/60 backdrop-blur-3xl border-b border-white/[0.08] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-primary/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-xl tracking-tighter uppercase leading-none">Medical Terminal</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)] animate-pulse" : "bg-red-500 opacity-50"}`} />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{wsConnected ? "Real-time Node Active" : "Offline Mode"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-6 mr-8">
                {[
                  { id: "queue", label: "Patient Queue" },
                  { id: "diagnostics", label: "Diagnostics" },
                  { id: "analytics", label: "Analytics" }
                ].map((item) => (
                  <button key={item.id} onClick={() => setCurrentView(item.id as any)} className={`text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-white ${currentView === item.id ? "text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/20" : "text-zinc-500"}`}>
                    {item.label}
                  </button>
                ))}
             </div>

            <button onClick={loadQueue} title="Refresh Queue" aria-label="Refresh Queue" className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
              <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
            <div className="relative">
              <button title="Notifications" aria-label="Notifications" className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                <Bell className="w-6 h-6" />
                {notifications > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-black font-black text-[10px] rounded-full flex items-center justify-center border-2 border-background">{notifications}</span>}
              </button>
            </div>
            <div className="h-8 w-px bg-white/[0.08] mx-2" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Commander</div>
                <div className="text-sm font-black text-white leading-none tracking-tight">{user?.name}</div>
              </div>
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 font-black border border-white/5">
                {user?.name?.[0]}
              </div>
            </div>
            <button onClick={handleLogout} title="Sign Out" aria-label="Sign Out" className="p-3 text-zinc-500 hover:text-red-400 hover:bg-white/10 rounded-2xl transition-all">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* 📊 Left Column - Snapshot */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">Operational Snapshot</h3>
                <BarChart3 className="w-6 h-6 text-zinc-600" />
              </div>
              
              <div className="h-[240px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-4xl font-black text-white tracking-tighter">{queue.length}</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Patients</div>
                </div>
              </div>

              <div className="mt-8 space-y-3 relative z-10">
                {pieData.map((d, i) => (
                  <button key={i} onClick={() => setRiskFilter(d.name === riskFilter ? null : d.name)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${d.name === riskFilter ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08]"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${d.name === riskFilter ? "text-black/60" : "text-zinc-400"}`}>{d.name} IMPACT</span>
                    </div>
                    <span className="text-lg font-black tracking-tighter">{d.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Tools Card */}
            <div className="bg-gradient-to-br from-primary/10 via-zinc-900 to-zinc-900 rounded-[2.5rem] p-8 border border-white/[0.08] shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                 <Zap className="w-4 h-4 fill-primary" /> Intelligence Core
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Imaging AI", icon: Scan, path: "/doctor/imaging", color: "text-blue-400" },
                    { label: "Whiteboard", icon: Brain, path: "/doctor/whiteboard", color: "text-purple-400" },
                    { label: "Lab Scanner", icon: Microscope, path: "/doctor/reports", color: "text-red-500" },
                    { label: "Records", icon: FileImage, path: "#", color: "text-orange-400" }
                  ].map((tool, i) => (
                    <button key={i} onClick={() => tool.path !== "#" && navigate(tool.path)}
                      className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] flex flex-col items-center gap-3 hover:bg-white/[0.08] hover:-translate-y-1 transition-all group">
                      <tool.icon className={`w-6 h-6 ${tool.color}`} />
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter text-center">{tool.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {/* 📋 Center Column - Queue */}
          <div className="lg:col-span-9 space-y-8">
             <div className="flex items-center justify-between px-2">
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                      Patient Queue <span className="text-sm font-black text-zinc-600 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05] ml-4 tracking-widest">{queue.length} Active</span>
                   </h2>
                   <p className="text-zinc-500 font-medium tracking-tight mt-1">Real-time triage synchronization and risk-prioritized processing.</p>
                </div>
                {riskFilter && (
                   <button onClick={() => setRiskFilter(null)} className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/[0.1] transition-all">
                      <X className="w-4 h-4" /> Reset Filters
                   </button>
                )}
             </div>

             {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                   <div className="relative">
                      <div className="w-20 h-20 border-4 border-white/[0.03] border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center"><Stethoscope className="w-8 h-8 text-primary/50" /></div>
                   </div>
                   <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Syncing Clinical Node...</p>
                </div>
             ) : currentView === "diagnostics" ? (
                <DiagnosticsView />
             ) : currentView === "analytics" ? (
                <AnalyticsView />
             ) : displayQueue.length === 0 ? (
                <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/[0.08] p-24 text-center shadow-2xl">
                   <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-xl shadow-primary/5">
                      <CheckCircle className="w-12 h-12 text-primary" />
                   </div>
                   <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Operations Clear</h3>
                   <p className="text-zinc-500 text-xl font-medium tracking-tight max-w-md mx-auto">No pending patients in the current segment. Standby for next consultation.</p>
                </div>
             ) : (
                <div className="grid gap-6">
                   <AnimatePresence mode="popLayout">
                      {displayQueue.map((item, idx) => (
                        <PatientQueueCard
                          key={item.id} item={item} idx={idx}
                          expanded={expanded === item.id}
                          onExpand={() => setExpanded(expanded === item.id ? null : item.id)}
                          onAccept={() => doAction(item.id, "Confirmed")}
                          onReject={() => doAction(item.id, "Cancelled")}
                          onConsult={() => navigate(`/consultation/${item.id}`)}
                          actionLoading={actionLoading}
                        />
                      ))}
                   </AnimatePresence>
                </div>
             )}
          </div>
        </div>
      </main>

      {/* Clinical Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
         <div className="bg-zinc-900/80 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/[0.1] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex items-center gap-12">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Triage Load</span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-lg font-black text-white leading-none">{(queue.length / 20 * 100).toFixed(0)}%</span>
                     <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(queue.length / 20 * 100)}%` }} />
                     </div>
                  </div>
               </div>
               <div className="w-px h-8 bg-white/[0.08]" />
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">System Time</span>
                  <span className="text-lg font-black text-white leading-none mt-1">{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            </div>
            <button onClick={() => navigate("/doctor/imaging")} className="px-8 py-3 bg-white text-black rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-white/5 hover:bg-zinc-200 transition-all active:scale-95">Open Imaging Core</button>
         </div>
      </div>
      <AICopilot onAction={handleCopilotAction} role="doctor" />
    </div>
  );
}

function PatientQueueCard({ item, idx, expanded, onExpand, onAccept, onReject, onConsult, actionLoading }: {
  item: QueueItem; idx: number; expanded: boolean;
  onExpand: () => void; onAccept: () => void; onReject: () => void; onConsult: () => void;
  actionLoading: string | null;
}) {
  const isActionLoading = (suffix: string) => actionLoading === item.id + suffix;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
      className={`bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.08] shadow-xl overflow-hidden transition-all hover:border-white/[0.15] group ${item.riskLevel === "HIGH" ? "ring-2 ring-red-500/30" : ""}`}>
      {/* Header Row */}
      <div className="p-8 flex items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.1] rounded-[1.75rem] flex items-center justify-center font-black text-3xl text-zinc-500 shadow-xl group-hover:scale-105 transition-transform flex-shrink-0">
          {item.patientName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <h4 className="text-2xl font-black text-white tracking-tighter truncate">{item.patientName}</h4>
            {item.patientAge && <span className="text-xs font-black text-zinc-500 bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.05] uppercase tracking-widest">{item.patientAge} years</span>}
            {item.riskLevel && (
               <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                 item.riskLevel === "HIGH" ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse" :
                 item.riskLevel === "MEDIUM" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                 "bg-rose-600/10 text-rose-500 border-rose-600/20"
               }`}>
                  <div className={`w-2 h-2 rounded-full ${item.riskLevel === "HIGH" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : item.riskLevel === "MEDIUM" ? "bg-orange-500" : "bg-rose-600"}`} />
                  {item.riskLevel} IMPACT {item.riskScore && <span className="ml-2 py-0.5 px-2 bg-white/10 rounded-md">{(item.riskScore * 100).toFixed(0)}% Score</span>}
               </div>
            )}
            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${item.status === "Confirmed" ? "bg-primary/10 text-primary border-primary/20" : "bg-zinc-800 text-zinc-500 border-white/5"}`}>{item.status}</span>
            {item.checkedIn && <span className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20"><Mic className="w-4 h-4" /> Locked In</span>}
          </div>
          <div className="flex items-center gap-8 text-xs font-black text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-700" /> {formatDate(item.date)}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-700" /> {formatTime(item.slot)}</span>
            {item.reason && <span className="flex items-center gap-2 max-w-sm truncate"><Activity className="w-4 h-4 text-zinc-700" /> {item.reason}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
           {item.status === "Confirmed" && (
             <button onClick={onConsult} className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 flex items-center gap-3">
               <Stethoscope className="w-4 h-4" /> Start Ops
             </button>
           )}
           <button onClick={onExpand} title={expanded ? "Collapse Details" : "Expand Details"} aria-label={expanded ? "Collapse Details" : "Expand Details"} className={`p-4 rounded-2xl border transition-all ${expanded ? "bg-white text-black border-white" : "text-zinc-500 hover:text-white bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"}`}>
             {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
           </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-8 pb-8 pt-4 space-y-6 border-t border-white/[0.05] bg-white/[0.01]">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* AI Summary */}
                {item.aiSummary && (
                  <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 relative overflow-hidden group/ai">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover/ai:scale-150 transition-transform duration-700" />
                    <div className="flex items-center gap-3 mb-6 relative z-10 text-primary uppercase font-black tracking-[0.2em] text-[10px]">
                      <Brain className="w-5 h-5" /> AI Triage Synthesis
                    </div>
                    <p className="text-lg font-medium text-white italic leading-relaxed relative z-10">"{item.aiSummary}"</p>
                    {item.criticalFlags?.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                        {item.criticalFlags.map(f => (
                          <span key={f} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-xl border border-red-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Health Info */}
                <div className="space-y-4">
                  {item.patientAllergies?.length > 0 && (
                    <div className="bg-zinc-900 border border-white/[0.05] rounded-[1.5rem] p-6">
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Clinical Allergies</div>
                      <div className="flex flex-wrap gap-2">{item.patientAllergies.map(a => <span key={a} className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-black border border-red-500/20">{a}</span>)}</div>
                    </div>
                  )}
                  {item.patientMedications?.length > 0 && (
                    <div className="bg-zinc-900 border border-white/[0.05] rounded-[1.5rem] p-6">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Current Protocol</div>
                      <div className="flex flex-wrap gap-2">{item.patientMedications.map(m => <span key={m} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black border border-blue-500/20">{m}</span>)}</div>
                    </div>
                  )}
                </div>
              </div>

              {item.status === "Pending" && (
                <div className="flex gap-4">
                  <button onClick={onAccept} disabled={!!actionLoading} className="flex-1 flex items-center justify-center gap-3 py-6 bg-primary text-black rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50">
                    {isActionLoading("Confirmed") ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6 shadow-[0_0_10px_rgba(0,0,0,0.2)]" />} Confirm Intake
                  </button>
                  <button onClick={onReject} disabled={!!actionLoading} className="px-10 py-6 bg-white/[0.03] text-zinc-500 rounded-2xl font-black text-lg uppercase tracking-widest border border-white/[0.08] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
