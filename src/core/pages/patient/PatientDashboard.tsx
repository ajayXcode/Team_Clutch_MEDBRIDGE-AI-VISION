import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth, Patient } from "../../context/AuthContext";
import { mockApi } from "../../lib/mockData";
import { getRiskBg, getRiskDot, formatDate, formatTime, getAge } from "../../lib/voice";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Mic, Calendar, User, Users, LogOut, Bell, ChevronDown,
  Plus, Star, Clock, Activity, Stethoscope, FileText, Shield, ArrowRight,
  CheckCircle, AlertTriangle, ChevronRight, Loader2, RefreshCw, Leaf,
  Thermometer, TrendingUp, HeartPulse, Brain, ShoppingCart
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "../../components/Logo";

interface Doctor { id: string; name: string; specialty: string; rating: number; experience: number; slots: string[]; avatar: string; available: boolean; }
interface Appointment { id: string; patientId: string; doctorId: string; date: string; slot: string; reason: string; status: string; riskLevel: string | null; riskScore: number | null; checkedIn: boolean; aiSummary: string | null; createdAt: string; }

const RELATION_COLORS: Record<string, string> = { Self: "bg-blue-100 text-blue-700", Spouse: "bg-pink-100 text-pink-700", Child: "bg-purple-100 text-purple-700", Parent: "bg-amber-100 text-amber-700", Sibling: "bg-green-100 text-green-700", Other: "bg-gray-100 text-gray-700" };

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, activePatient, allPatients, setActivePatient, logout, refreshPatients } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [tab, setTab] = useState<"appointments" | "doctors">("appointments");
  const [vitals, setVitals] = useState({ heartRate: 72, temp: 36.6 });
  const [rewardPoints, setRewardPoints] = useState(0);

  const getVitalsStatus = () => {
    if (vitals.heartRate > 100 || vitals.temp > 38.5) return { label: "Needs Attention", color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle };
    if (vitals.heartRate > 90 || vitals.temp > 37.5) return { label: "Slightly Elevated", color: "text-amber-500", bg: "bg-amber-50", icon: TrendingUp };
    return { label: "Optimal Status", color: "text-green-500", bg: "bg-green-50", icon: CheckCircle };
  };

  useEffect(() => {
    if (!user || user.role !== "patient") { navigate("/patient/login"); return; }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docs = mockApi.getDoctors();
      const apptPatientId = activePatient?.id || user.accountId;
      const appts = mockApi.getAppointments(apptPatientId);
      setDoctors(docs);
      setAppointments(appts);
      setRewardPoints(mockApi.getRewardPoints(apptPatientId));
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [user, activePatient]);

  useEffect(() => { loadData(); }, [loadData]);

  const switchPatient = (p: Patient) => { setActivePatient(p); setFamilyOpen(false); };
  const handleLogout = () => { logout(); navigate("/"); };

  const upcoming = appointments.filter(a => a.status !== "Cancelled" && a.status !== "Completed");
  const past = appointments.filter(a => a.status === "Completed");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 text-white">
      {/* Top Nav */}
      <nav className="bg-[#050505]/60 backdrop-blur-3xl border-b border-white/[0.08] sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="md" />

          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setFamilyOpen(!familyOpen)} className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">
                  {activePatient?.name?.[0] || "?"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Switch Patient</div>
                  <div className="text-sm font-black text-white leading-none tracking-tight">{activePatient?.name || "Select Member"}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>
              <AnimatePresence>
                {familyOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full right-0 mt-4 w-72 bg-zinc-900 border border-white/[0.1] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] py-4 z-50 overflow-hidden backdrop-blur-xl">
                    <div className="px-6 py-2 mb-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Family Ecosystem</div>
                    {allPatients.map(p => (
                      <button key={p.id} onClick={() => switchPatient(p)} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.05] transition-all ${activePatient?.id === p.id ? "bg-primary/10 border-l-4 border-primary" : ""}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${activePatient?.id === p.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-800 text-zinc-400"}`}>
                          {p.name[0]}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-black text-white mb-1">{p.name}</div>
                          <div className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-zinc-800 text-zinc-500`}>{p.relationship}</div>
                        </div>
                        {activePatient?.id === p.id && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/profile")} title="Profile Management" className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><User className="w-6 h-6" /></button>
              <button onClick={handleLogout} title="Logout System" className="p-3 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-2xl transition-all"><LogOut className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/20 rounded-[2.5rem] p-10 border border-white/[0.08] text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">MEDBRIDGE AI-Vision Unified Dashboard</p>
                <h2 className="text-5xl font-black mb-4 tracking-tighter leading-[0.9]">Welcome,<br />{activePatient?.name || user.name}</h2>
                {activePatient?.dob && <p className="text-zinc-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /> {getAge(activePatient.dob)} years · {activePatient.gender}</p>}
              </div>
              <div className="flex flex-wrap gap-4 md:justify-end">
                <button onClick={() => navigate("/book/voice")} className="group flex items-center gap-3 px-8 py-5 bg-white text-black rounded-[2rem] font-black text-xl hover:bg-zinc-200 transition-all shadow-xl hover:scale-105 active:scale-95">
                  <Mic className="w-6 h-6 text-primary" /> Voice Book
                </button>
                <button onClick={() => navigate("/book/manual")} className="flex items-center gap-3 px-8 py-5 bg-white/[0.03] text-white border-2 border-white/[0.08] rounded-[2rem] font-black text-xl hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95">
                  <Calendar className="w-6 h-6 text-zinc-500" /> Manual
                </button>
              </div>
            </div>
          </motion.div>

          <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20"><HeartPulse className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Health Vitality</h3>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Real-time Proactive Monitoring</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${getVitalsStatus().bg.replace('bg-green-50', 'bg-primary/20').replace('bg-red-50', 'bg-red-500/20').replace('bg-amber-50', 'bg-orange-500/20')} ${getVitalsStatus().color.replace('text-green-500', 'text-primary').replace('text-red-500', 'text-red-400').replace('text-amber-500', 'text-orange-400')}`}>
                {(() => { const Icon = getVitalsStatus().icon; return <Icon className="w-4 h-4" />; })()}
                {getVitalsStatus().label}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Heart Rate</span>
                  <span className="text-3xl font-black text-white tracking-tighter">{vitals.heartRate} <span className="text-sm text-zinc-600">bpm</span></span>
                </div>
                <input type="range" min="40" max="160" value={vitals.heartRate} onChange={(e) => setVitals(v => ({ ...v, heartRate: parseInt(e.target.value) }))} className="w-full h-8 bg-transparent appearance-none cursor-pointer accent-primary" aria-label="Heart Rate Monitor" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Thermometer className="w-4 h-4 text-orange-400" /> Temperature</span>
                  <span className="text-3xl font-black text-white tracking-tighter">{vitals.temp.toFixed(1)} <span className="text-sm text-zinc-600">°C</span></span>
                </div>
                <input type="range" min="35" max="41" step="0.1" value={vitals.temp} onChange={(e) => setVitals(v => ({ ...v, temp: parseFloat(e.target.value) }))} className="w-full h-8 bg-transparent appearance-none cursor-pointer accent-orange-500" aria-label="Body Temperature Monitor" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-1.5 bg-white/[0.03] border border-white/10 rounded-[2rem]">
            <button onClick={() => setTab("appointments")} className={`flex-1 py-4 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-[0.2em] ${tab === "appointments" ? "bg-white text-black shadow-2xl" : "text-zinc-500 hover:text-white"}`}>Journey</button>
            <button onClick={() => setTab("doctors")} className={`flex-1 py-4 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-[0.2em] ${tab === "doctors" ? "bg-white text-black shadow-2xl" : "text-zinc-500 hover:text-white"}`}>Specialists</button>
          </div>

          {tab === "appointments" ? (
            <div className="space-y-6">
              {upcoming.length > 0 ? (
                upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} doctors={doctors} onCheckIn={() => navigate(`/checkin/${appt.id}`)} />)
              ) : (
                <div className="bg-zinc-900 border border-white/[0.05] rounded-[2.5rem] p-16 text-center">
                  <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-6" />
                  <p className="text-zinc-500 font-bold">No active medical journeys detected.</p>
                </div>
              )}
              {past.length > 0 && (
                <div className="pt-8 border-t border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-4 mb-4">Historical Archives</p>
                  {past.slice(0, 3).map(appt => <AppointmentCard key={appt.id} appt={appt} doctors={doctors} past />)}
                </div>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} onClick={() => navigate(`/book/manual?doctorId=${doc.id}`)} className="p-6 bg-zinc-900 border border-white/[0.08] rounded-3xl group hover:border-primary/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{doc.avatar}</div>
                    <div>
                      <h4 className="font-black text-white uppercase tracking-tight">{doc.name}</h4>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{doc.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /><span className="text-[10px] font-black text-zinc-500">{doc.rating}</span></div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{doc.experience}Y EXP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Reward Points Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/inventory")}
            className="group relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[2.5rem] border border-white/[0.1] p-8 shadow-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="absolute top-[-2rem] right-[-2rem] w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] bg-black/40 px-4 py-2 rounded-full border border-white/5">MEDBRIDGE PRIVILEGE</div>
            </div>
            
            <div>
              <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">Health Credits</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">{rewardPoints.toLocaleString()} <span className="text-sm text-primary font-bold uppercase tracking-widest">PTS</span></h4>
            </div>
            
            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
              Redeem in Inventory <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-zinc-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.08] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500 via-primary to-orange-500" />
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tighter"><HeartPulse className="w-5 h-5 text-red-500" /> Health Pulse</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em]">Live Sync</span>
              </div>
            </div>
            <div className="relative space-y-12">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-white/5" />
              {[
                { time: "NOW", icon: Activity, label: "Heart Rate Monitor", desc: "Stable tracking @ 72bpm", color: "bg-red-500" },
                { time: "09:45 AM", icon: Brain, label: "AI Triage Uploaded", desc: "Analysis for today's slot", color: "bg-purple-500" },
                { time: "YESTERDAY", icon: FileText, label: "Prescription Sync", desc: "Linked to ABHA Health Locker", color: "bg-blue-500" },
              ].map((step, i) => (
                <div key={i} className="relative flex gap-6">
                  <div className={`w-12 h-12 rounded-2xl ${step.color}/20 border border-${step.color}/30 flex items-center justify-center relative z-10 bg-zinc-900 shadow-xl`}><step.icon className="w-6 h-6 text-zinc-400" /></div>
                  <div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{step.time}</div>
                    <h5 className="text-white text-xs font-black uppercase tracking-tight mb-0.5">{step.label}</h5>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 bg-red-600/5 border border-red-600/10 rounded-[2rem] relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-4 relative z-10"><Shield className="w-5 h-5 text-red-500" /><span className="text-[10px] font-black text-red-500 uppercase tracking-widest">MEDBRIDGE AI-Vision Clinical Alert</span></div>
              <p className="text-[11px] text-zinc-400 font-bold leading-relaxed mb-4 italic relative z-10">"Hydration detected as LOW. Temperature is 0.4°C higher than your baseline. Increased water intake recommended before your consultation."</p>
              <button className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-600/10 active:scale-95 shadow-lg">Acknowledge</button>
            </div>
          </motion.div>

          <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] p-8 space-y-4">
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Operations Center</p>
             {[
              { label: "ABHA Identity Card", icon: Shield, path: "/profile/abha/card", color: "text-rose-500" },
              { label: "Medicine Inventory", icon: ShoppingCart, path: "/inventory", color: "text-amber-500" },
               { label: "Nearby Clinics", icon: Leaf, path: "/clinics/nearby", color: "text-blue-400" },
               { label: "Security & Privacy", icon: Activity, path: "/profile", color: "text-zinc-400" },
             ].map((action, i) => (
                <button key={i} onClick={() => navigate(action.path)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.08] transition-all group">
                   <div className={`w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}><action.icon size={18} /></div>
                   <span className="text-xs font-black text-zinc-300 uppercase tracking-tight">{action.label}</span>
                   <ArrowRight className="w-4 h-4 text-zinc-700 ml-auto group-hover:translate-x-1 transition-transform" />
                </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appt, onCheckIn, past, doctors }: { appt: Appointment; onCheckIn?: () => void; past?: boolean; doctors: Doctor[] }) {
  const doctor = doctors.find(d => d.id === appt.doctorId);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.08] p-8 relative overflow-hidden group hover:border-white/20 transition-all ${appt.riskLevel === "HIGH" ? "border-l-4 border-l-red-500 shadow-[0_0_50px_-20px_rgba(239,68,68,0.3)]" : ""}`}>
      <div className="flex flex-col md:flex-row gap-6 md:items-center relative z-10">
        <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Calendar size={32} /></div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${appt.status === "Completed" ? "bg-zinc-800 text-zinc-500 border-white/5" : "bg-primary/20 text-primary border-primary/20"}`}>{appt.status}</span>
            {appt.riskLevel === "HIGH" && <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/30">CRITICAL PRIORITY</span>}
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{formatDate(appt.date)} @ {formatTime(appt.slot)}</span>
          </div>
          <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2 truncate">{doctor?.name || "Clinical Consultation"}</h4>
          <p className="text-sm text-zinc-500 font-medium">{appt.reason}</p>
        </div>
        {!past && !appt.checkedIn && (
          <button onClick={onCheckIn} className="px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-zinc-200 transition-all active:scale-95">Check-in</button>
        )}
      </div>
      {appt.aiSummary && (
        <div className="mt-8 p-6 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] group-hover:bg-white/[0.04] transition-all">
          <div className="flex items-center gap-2 mb-3"><Brain size={14} className="text-purple-400" /><span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">MEDBRIDGE AI-Vision Clinical Synthesis</span></div>
          <p className="text-xs text-zinc-400 font-medium italic italic leading-relaxed">"{appt.aiSummary}"</p>
        </div>
      )}
    </motion.div>
  );
}
