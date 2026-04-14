import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Heart, Eye, EyeOff, Loader2, User, Key, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Logo } from "../../components/Logo";
import { DottedSurface } from "../../components/ui/dotted-surface";

export default function PatientLogin() {
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
      toast.success("Welcome back!");
      navigate("/patient/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 overflow-hidden selection:bg-primary/30">
      <DottedSurface className="w-full h-full opacity-20" />
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Logo size="lg" className="mb-10 justify-center" />
          <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">Patient Portal</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Access your health ecosystem terminal.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.08] p-10 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Terminal ID (Email)</label>
              <div className="relative group">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all font-medium" />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Access Key</label>
                <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">Forgot Key?</button>
              </div>
              <div className="relative group">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all font-medium" />
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black text-lg uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-white/5 group active:scale-95">
              {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Authorizing...</> : <>Initialize Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>

            {/* ✅ QUICK LOGIN FOR HACKATHON DEMO */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button type="button" onClick={() => { setEmail("patient@medbridge.app"); setPassword("Patient@123"); }}
                className="py-3 px-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-tighter hover:bg-primary/20 transition-all">
                Auto-Fill Patient
              </button>
              <button type="button" onClick={() => { setEmail("doctor@medbridge.app"); setPassword("Doctor@123"); }}
                className="py-3 px-2 bg-red-600/10 border border-red-600/20 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-tighter hover:bg-red-600/20 transition-all">
                Auto-Fill Doctor
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.05] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">New user?</span>
              <Link to="/patient/register" className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Register Now
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Medical Staff?</span>
              <Link to="/doctor/login" className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors">
                Doctor Portal →
              </Link>
            </div>
          </div>
        </motion.div>
        
        <p className="mt-8 text-center text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">MEDBRIDGE AI-Vision · Secure Connection</p>
      </div>
    </div>
  );
}
