import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../lib/mockData";
import { formatTime } from "../../lib/voice";
import { ArrowLeft, Star, Clock, Calendar, Loader2, CheckCircle, Heart, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

interface Doctor { id: string; name: string; specialty: string; rating: number; experience: number; slots: string[]; avatar: string; }

export default function ManualBooking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, activePatient } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [slot, setSlot] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"doctor" | "slot">("doctor");

  useEffect(() => {
    if (!user) navigate("/patient/login");
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
    const docs = mockApi.getDoctors();
    setDoctors(docs);
    const preselect = params.get("doctorId");
    if (preselect) {
      const doc = docs.find(d => d.id === preselect);
      if (doc) { setSelected(doc); setStep("slot"); }
    }
  }, []);

  const book = async () => {
    if (!selected || !slot || !date || !activePatient) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const appt = mockApi.bookAppointment({
        patientId: activePatient.id || user?.accountId || "demo-patient-001",
        doctorId: selected.id, date, slot,
        reason: reason || "General consultation"
      });
      toast.success("✅ Appointment booked!");
      navigate(`/booking/confirmation/${appt.id}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-[-10rem] w-[30rem] h-[30rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/patient/dashboard")} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Manual Booking</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Phase {step === "doctor" ? 1 : 2} / 2</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {step === "doctor" ? (
          <>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <Search className="w-4 h-4" /> Available Providers
            </h3>
            <div className="space-y-4">
              {doctors.map((doc, i) => (
                <motion.button key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setSelected(doc); setStep("slot"); }}
                  className="w-full bg-zinc-900/40 backdrop-blur-sm rounded-2xl border border-white/[0.05] p-5 hover:bg-white/[0.03] hover:border-primary/50 transition-all text-left flex items-center gap-5 group">
                  <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center text-zinc-300 font-bold text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">{doc.avatar}</div>
                  <div className="flex-1">
                    <div className="font-black text-white text-lg tracking-wide uppercase">{doc.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{doc.specialty} · {doc.experience}y EXP</div>
                    <div className="flex items-center gap-1.5 mt-2 bg-black/20 w-max px-2 py-1 rounded-md">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-black">{doc.rating}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary flex flex-col items-center gap-1 bg-primary/10 px-3 py-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                    {doc.slots.length} SLOTS
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Selected doctor summary */}
            <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-5 flex items-center gap-4 mb-8 shadow-2xl">
              <div className="w-14 h-14 bg-white/[0.05] rounded-xl border border-white/[0.05] flex items-center justify-center text-white font-black text-xl">{selected?.avatar}</div>
              <div className="flex-1">
                <div className="font-black text-white uppercase tracking-wide">{selected?.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{selected?.specialty}</div>
              </div>
              <button onClick={() => setStep("doctor")} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white bg-white/[0.05] px-3 py-2 rounded-lg transition-colors">Demote</button>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.02] p-6 rounded-3xl">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Target Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors cursor-pointer" />
              </div>

              <div className="bg-white/[0.02] border border-white/[0.02] p-6 rounded-3xl">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Select Block
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {selected?.slots.map(s => (
                    <button key={s} onClick={() => setSlot(s)}
                      className={`py-3.5 rounded-xl text-[11px] font-black tracking-widest border transition-all 
                        ${slot === s ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:border-primary/50 hover:bg-white/[0.05]"}`}>
                      {slot === s && <CheckCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}{formatTime(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.02] p-6 rounded-3xl">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
                  Symptom Vector <span className="text-zinc-700 ml-1">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["General Checkup", "Fever", "Cough", "Headache", "Stomach Ache", "Vaccination"].map(r => (
                    <button key={r} onClick={() => setReason(r)} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors 
                        ${reason === r ? "bg-primary text-white border-primary" : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:bg-white/[0.08]"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Elaborate if necessary..."
                  className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors" />
              </div>

              <button onClick={book} disabled={!slot || !date || loading}
                className="w-full mt-4 py-5 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 group">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting...</> : <><CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Confirm & Log Appointment</>}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
