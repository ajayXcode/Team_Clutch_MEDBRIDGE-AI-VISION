import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Shield, Download, FileText, FlaskConical,
  FileHeart, ClipboardList, Loader2, Calendar,
  Building2, ChevronRight, Share2, Lock, Wifi, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface HealthRecord { id: string; date: string; facility: string; type: "Prescription" | "Lab Report" | "Discharge Summary" | "Consultation Note" | "Imaging Report"; doctor: string; summary: string; downloadUrl?: string; }

const TYPE_ICONS: Record<string, any> = {
  "Prescription": FileText, "Lab Report": FlaskConical, "Discharge Summary": FileHeart, "Consultation Note": ClipboardList, "Imaging Report": FileText,
};

const TYPE_COLORS: Record<string, string> = {
  "Prescription": "bg-blue-500/10 text-blue-400 border-blue-500/20", "Lab Report": "bg-purple-500/10 text-purple-400 border-purple-500/20", "Discharge Summary": "bg-red-500/10 text-red-500 border-red-500/20", "Consultation Note": "bg-red-600/10 text-red-500 border-red-600/20", "Imaging Report": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const MOCK_RECORDS: HealthRecord[] = [
  { id: "rec-001", date: "2026-02-15", facility: "AIIMS Delhi", type: "Discharge Summary", doctor: "Dr. Priya Mehta", summary: "Patient admitted for acute appendicitis. Laparoscopic appendectomy performed. Discharged after 3 days with full recovery." },
  { id: "rec-002", date: "2026-01-08", facility: "Apollo Hospital, Delhi", type: "Lab Report", doctor: "Dr. Rahul Sharma", summary: "Complete Blood Count: WBC 8.2k, RBC 4.9M, Hemoglobin 13.8 g/dL. Thyroid: TSH 2.1 mIU/L. All values within normal range." },
  { id: "rec-003", date: "2025-12-20", facility: "Fortis Hospital", type: "Prescription", doctor: "Dr. Anita Kapoor", summary: "Amoxicillin 500mg TDS × 7 days, Paracetamol 650mg SOS, Vitamin D3 60,000 IU weekly × 8 weeks." },
  { id: "rec-004", date: "2025-11-10", facility: "Max Healthcare, Noida", type: "Imaging Report", doctor: "Dr. Vikram Singh", summary: "Chest X-Ray PA view: Lungs clear, no active consolidation, cardiac silhouette normal, no pleural effusion detected." },
  { id: "rec-005", date: "2025-10-03", facility: "Columbia Asia Hospital", type: "Consultation Note", doctor: "Dr. Meena Iyer", summary: "Patient presents with Type 2 Diabetes. HbA1c 7.2%. Metformin 500mg BD continued. Diet counselling provided. Follow-up in 3 months." },
];

export default function AbhaLocker() {
  const navigate = useNavigate();
  const { activePatient } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!activePatient?.abhaLinked) {
      toast.error("Generate identity vector first");
      navigate("/profile/abha/create");
      return;
    }
    setTimeout(() => { setRecords(MOCK_RECORDS); setLoading(false); }, 1500);
  }, [activePatient, navigate]);

  const types = ["All", ...Array.from(new Set(MOCK_RECORDS.map(r => r.type)))];
  const filtered = filter === "All" ? records : records.filter(r => r.type === filter);

  const handleDownload = (rec: HealthRecord) => { toast.success(`Acquiring payload: ${rec.type}`); };
  const handleShare = (rec: HealthRecord) => {
    if (navigator.share) navigator.share({ title: `${rec.type} – ${rec.facility}`, text: rec.summary });
    else { navigator.clipboard.writeText(rec.summary); toast.success("Encrypted data copied to clipboard"); }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-600/30">
      <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/profile/abha/card")} title="Back to Identity Card" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <div className="w-9 h-9 bg-rose-600/20 border border-rose-600/30 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4 text-rose-500" /></div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Health Vault</h2>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-[0.2em]">ABDM Architecture</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/10 border border-rose-600/30 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(225,29,72,0.1)]">
           <Wifi className="w-3 h-3 animate-pulse" /> Linked
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-rose-600/10 border border-rose-600/30 rounded-[2rem] p-6 text-white mb-8 flex items-center gap-5 shadow-[0_0_40px_rgba(225,29,72,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-transparent pointer-events-none" />
          <div className="w-14 h-14 bg-rose-600/20 border border-rose-600/30 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 text-rose-500" />
          </div>
          <div className="relative z-10">
            <h3 className="font-black text-lg uppercase tracking-wider mb-1 text-rose-500 shadow-rose-600">Encrypted Storage</h3>
            <p className="text-rose-200/70 text-[10px] font-bold tracking-[0.2em] mb-1 uppercase">Vector ID: {activePatient?.abhaId || "77-1234-5678-9012"}</p>
            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.1em]">{records.length} Logs Retrieved from Mainframe</p>
          </div>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filter === t ? "bg-rose-600 text-black border-transparent shadow-[0_0_15px_rgba(225,29,72,0.4)]" : "bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:border-rose-600/50 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 bg-rose-600/10 border border-rose-600/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                <Shield className="w-8 h-8 text-rose-500" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-rose-600/20 border-t-rose-500 animate-spin" />
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Establishing Mainframe Uplink...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((rec, i) => {
                const Icon = TYPE_ICONS[rec.type] || FileText;
                const colorClass = TYPE_COLORS[rec.type] || "bg-white/[0.05] text-zinc-400 border-white/[0.1]";
                const isExpanded = expanded === rec.id;
                return (
                  <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} 
                    className="bg-zinc-900/60 backdrop-blur-xl rounded-[1.5rem] border border-white/[0.08] shadow-xl overflow-hidden group hover:border-white/[0.15] transition-colors">
                    <div className="p-5 cursor-pointer flex items-start gap-4" onClick={() => setExpanded(isExpanded ? null : rec.id)}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="font-black text-white text-sm uppercase tracking-wider">{rec.type}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${colorClass}`}>{rec.facility}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{rec.date}</span>
                          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{rec.doctor}</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90 text-white" : ""}`} />
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 space-y-4">
                            <div className="bg-black/40 border border-white/[0.05] rounded-xl p-4">
                              <p className="text-[11px] text-zinc-300 tracking-wide font-medium leading-relaxed">{rec.summary}</p>
                            </div>
                            <div className="flex gap-3">
                              <button onClick={(e) => { e.stopPropagation(); handleDownload(rec); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                                <Download className="w-4 h-4" /> Download Raw
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleShare(rec); }}
                                className="flex items-center justify-center gap-2 px-6 py-3 border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                                <Share2 className="w-4 h-4" /> Share
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="text-center py-16 bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] rounded-[2rem]">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">No Logs Matching '{filter}'</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-500/80 leading-relaxed">
             Simulation Override Active:<br/><span className="text-zinc-400">Data presented is a sandbox reconstruction. Production environments sync with global medical network.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
