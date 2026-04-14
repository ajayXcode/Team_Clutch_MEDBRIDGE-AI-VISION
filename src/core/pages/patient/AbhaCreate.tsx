import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
// api replaced by mockApi
import { ArrowLeft, Shield, Loader2, Heart, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function AbhaCreate() {
  const navigate = useNavigate();
  const { activePatient, updateActivePatient } = useAuth();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);

  const generateOtp = async () => {
    if (!mobile || !/^\d{10}$/.test(mobile)) { toast.error("Invalid mobile string"); return; }
    setLoading(true);
    try {
      const res = await api.post<any>("/abha/generate-otp", { mobile });
      setSessionId(res.sessionId);
      setStep("otp");
      toast.success("Validation code dispatched");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 6) { toast.error("Invalid syntax"); return; }
    setLoading(true);
    try {
      const res = await api.post<any>("/abha/verify-otp", { otp, sessionId });
      if (activePatient) {
        await api.put(`/patients/${activePatient.id}`, { abhaId: res.abhaId, abhaLinked: true });
        updateActivePatient({ abhaId: res.abhaId, abhaLinked: true });
      }
      toast.success("Identity vector secured!");
      navigate("/profile/abha/card");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30 relative flex flex-col overflow-hidden">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10rem] left-[-10rem] w-[30rem] h-[30rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile/abha/card")} title="Back to Card" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <div className="w-8 h-8 bg-gradient-to-br from-rose-600 to-red-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.2)]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Initialize Identity</h2>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">ABHA Protocol</p>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-600/30 bg-red-600/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          {[0, 150, 300].map(d => <div key={d} className={`w-2 h-2 bg-red-500 rounded-full animate-bounce ${d === 150 ? "delay-150" : d === 300 ? "delay-300" : ""}`} />)}
          Phase {step === "mobile" ? "1" : "2"} / 2
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 z-10 w-full relative">
        <div className="w-full max-w-lg">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
            className="bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/[0.08] p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors pointer-events-none" />
            
            {step === "mobile" ? (
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-rose-600/10 border border-rose-600/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                    <Smartphone className="w-10 h-10 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Establish Uplink</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Enter secure comms channel</p>
                </div>
                
                <div className="mb-6 space-y-2">
                  <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2">Communications Vector</label>
                  <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="0000000000"
                    className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-black/50 text-white focus:outline-none focus:border-rose-600/50 text-xl tracking-[0.3em] font-mono text-center placeholder:text-zinc-700 transition-colors" />
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed text-center">
                    Development Bypass:<br/> <span className="text-white mt-1 block tracking-[0.2em]">Input any numeric string. Override code is 123456.</span>
                  </p>
                </div>
                
                <button onClick={generateOtp} disabled={loading || !mobile} 
                  className="w-full py-4 bg-rose-600 text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] active:scale-95">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Transmit Request
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <Shield className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Verify Uplink</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Payload dispatched to {mobile}</p>
                </div>
                
                <div className="mb-8 space-y-2">
                  <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Authorization Code</label>
                  <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6}
                    className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-black/50 text-white focus:outline-none focus:border-blue-500/50 text-3xl tracking-[0.5em] font-mono text-center placeholder:text-zinc-800 transition-colors" />
                </div>
                
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center mb-8">
                  Override Code: <span className="text-white">123456</span>
                </p>
                
                <div className="flex gap-4">
                  <button onClick={() => setStep("mobile")} className="flex-1 py-4 border border-white/[0.1] bg-white/[0.02] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-colors">Abort</button>
                  <button onClick={verifyOtp} disabled={loading || otp.length < 6} 
                    className="flex-[1.5] py-4 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Execute Splice
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
