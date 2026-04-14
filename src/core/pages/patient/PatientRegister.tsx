import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";
import { Heart, Eye, EyeOff, Loader2, CheckCircle, User, Mail, Phone, Lock, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { DottedSurface } from "../../components/ui/dotted-surface";

export default function PatientRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Valid 10-digit number required";
    if (!form.password || form.password.length < 8) errs.password = "Min 8 characters";
    if (!/\d/.test(form.password)) errs.password = "Must contain a number";
    if (form.password !== form.confirm) errs.confirm = "Passwords mismatch";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const strength = useCallback(() => {
    if (!form.password) return 0;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/\d/.test(form.password)) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  }, [form.password]);

  const strengthColor = (s: number) => {
    if (s <= 1) return "bg-red-500 shadow-red-500/50";
    if (s === 2) return "bg-orange-500 shadow-orange-500/50";
    if (s === 3) return "bg-primary shadow-primary/50";
    return "bg-rose-600 shadow-rose-600/50";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      toast.success("Account created! Access granted. 🎉");
      navigate("/patient/onboarding");
    } catch (err: any) {
      if (err.message?.includes("already registered") || err.message?.includes("409")) {
        setErrors({ email: "Email already registered. Login instead?" });
      } else {
        toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStrength = strength();

  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 py-12 overflow-hidden selection:bg-primary/30">
      <DottedSurface className="w-full h-full opacity-20" />
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Logo size="lg" className="mb-8 justify-center" />
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Initialize Profile</h1>
          <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Secure Patient Node Creation</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/[0.08] p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Full Legal Name</label>
              <div className="relative group">
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.03] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium ${errors.name ? 'border-red-500/50 focus:border-red-500/50' : 'border-white/[0.08] focus:border-primary/50'}`} />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              </div>
              {errors.name && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest pl-1">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Terminal ID (Email)</label>
              <div className="relative group">
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@domain.com"
                  className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.03] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium ${errors.email ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              </div>
              {errors.email && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest pl-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Comms Network (Phone)</label>
              <div className="relative group">
                <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.03] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium ${errors.phone ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              </div>
              {errors.phone && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest pl-1">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Access Key (Password)</label>
              <div className="relative group">
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3.5 bg-white/[0.03] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium ${errors.password ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 pl-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStrength ? strengthColor(currentStrength) + ' shadow-lg' : "bg-white/[0.05]"}`} />
                    ))}
                  </div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">Strength: {["None", "Weak", "Fair", "Good", "Strong"][currentStrength]}</p>
                </div>
              )}
              {errors.password && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest pl-1">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Verify Key</label>
              <div className="relative group">
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3.5 bg-white/[0.03] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-zinc-600 transition-all text-sm font-medium ${errors.confirm ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
              </div>
              {form.confirm && form.password === form.confirm && (
                <div className="flex items-center gap-1.5 mt-1.5 pl-1 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" /> Keys Match
                </div>
              )}
              {errors.confirm && <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest pl-1">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-4 py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] group active:scale-95">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning...</> : <>Deploy Profile <Sparkles className="w-4 h-4 ml-1 text-primary group-hover:scale-110 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
              Resident Node?
              <Link to="/patient/login" className="text-primary hover:text-white transition-colors flex items-center gap-1">
                Initialize Session <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
        
        <p className="mt-6 text-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">MEDBRIDGE AI-Vision OS · Secure Connection</p>
      </div>
    </div>
  );
}
