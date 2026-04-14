import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Stethoscope, Eye, EyeOff, Loader2, Heart, ChevronRight, Activity } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Logo } from "../../components/Logo";
import { DottedSurface } from "../../components/ui/dotted-surface";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome, Doctor!");
      navigate("/doctor/dashboard");
    } catch (err: any) { toast.error(err.message || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  const demoLogin = async (email: string, password: string) => {
    setEmail(email); setPassword(password);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Demo login successful!");
      navigate("/doctor/dashboard");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden selection:bg-red-600/30">
      <DottedSurface className="w-full h-full opacity-20" />
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Logo size="md" className="mb-6 justify-center" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest mb-6 shadow-[0_0_10px_rgba(220,38,38,0.1)]">
            <Stethoscope className="w-3.5 h-3.5" /> Clinical Node
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Provider Access</h1>
          <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Authenticate to manage patient queue</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/[0.08] p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Provider ID (Email)</label>
              <div className="relative group">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@curesathi.app"
                  className="w-full pl-10 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium" />
                <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Clearance Key</label>
              </div>
              <div className="relative group">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-4 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] group active:scale-95">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><Stethoscope className="w-4 h-4 group-hover:scale-110 transition-transform" /> Execute Login</>}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-white/[0.05]">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="flex-1 h-px bg-white/[0.05]" />
              Demo Provider Nodes
              <span className="flex-1 h-px bg-white/[0.05]" />
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Dr. Arjun Nair", email: "doctor@medbridge.app", password: "Doctor@123" },
                { name: "Dr. Anita Sharma", email: "anita@medbridge.app", password: "Doctor@123" },
              ].map(d => (
                <button key={d.email} onClick={() => demoLogin(d.email, d.password)} disabled={loading}
                  className="text-left p-3.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.05] hover:border-red-600/30 transition-all group">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-red-500 transition-colors truncate">{d.name}</div>
                  <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 mt-1 truncate">{d.email.split("@")[0]} <ChevronRight className="w-2.5 h-2.5" /></div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center flex items-center justify-center">
            <Link to="/patient/login" className="text-[10px] font-black text-zinc-500 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1">
              Access Patient Portal <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
        
        <p className="mt-6 text-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">MEDBRIDGE AI-Vision · Developed by Team_Clutch</p>

      </div>
    </div>
  );
}
