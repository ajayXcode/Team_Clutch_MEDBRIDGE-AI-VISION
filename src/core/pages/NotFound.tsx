import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Heart, Home, ArrowLeft, Stethoscope, Search, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] h-[20rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md relative z-10 w-full">
        {/* Header/Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-zinc-900/40 backdrop-blur-md border border-white/[0.05] px-5 py-3 rounded-[1rem] shadow-2xl">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-black uppercase tracking-widest text-white block leading-none mb-1">MEDBRIDGE AI-Vision</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] block leading-none">System Terminal</span>
            </div>
          </div>
        </div>

        {/* 404 Visual */}
        <div className="relative mb-8 bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-10 shadow-2xl flex flex-col items-center justify-center group overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[40px] transform group-hover:scale-150 transition-transform pointer-events-none" />
          
          <div className="text-[100px] font-black text-white/5 leading-none select-none tracking-tighter mix-blend-overlay">404</div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-black uppercase tracking-widest text-white mb-2">Node Disconnected</h1>
        <p className="text-[11px] font-medium text-zinc-400 mb-8 uppercase tracking-widest leading-relaxed">
          The requested subsystem could not be located.<br/>
          Secure health telemetry remains preserved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 w-full">
          <button onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-4 border border-white/[0.1] bg-white/[0.02] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400" /> Return
          </button>
          <button onClick={() => navigate("/")}
            className="flex-[1.5] flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Home className="w-4 h-4" /> Root Portal
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 bg-white/[0.02] border border-white/[0.05] py-4 px-6 rounded-2xl w-full flex-wrap">
          <button onClick={() => navigate("/patient/login")} className="hover:text-white transition-colors">
            Patient
          </button>
          <span className="w-1 h-1 bg-zinc-800 rounded-full" />
          <button onClick={() => navigate("/doctor/login")} className="hover:text-red-500 transition-colors flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" /> Clinical
          </button>
          <span className="w-1 h-1 bg-zinc-800 rounded-full" />
          <button onClick={() => navigate("/rx-scanner")} className="hover:text-red-500 transition-colors flex items-center gap-1.5">
            <Search className="w-3 h-3" /> Scanner
          </button>
        </div>
      </motion.div>
    </div>
  );
}
