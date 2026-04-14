import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Heart, Upload, FileText, Loader2, Plus, LogOut, FileSearch, ArrowRight, Home, CheckCircle } from "lucide-react";

export default function BookingConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary/30">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-[40px] rounded-3xl border border-white/[0.08] p-8 text-center relative z-10 shadow-2xl">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(249,115,22,0.3)] border border-primary/30">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-3">Booking Secured</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8">Appointment parameters successfully logged.</p>
        
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8 text-left">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Next Protocol</h3>
          <p className="text-sm font-medium text-zinc-300 leading-relaxed">
            Please arrive at the clinic 10 minutes prior to your scheduled block to finalize the automated triage flow.
          </p>
        </div>

        <button onClick={() => navigate("/patient/dashboard")}
          className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 group">
          <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Back to Base
        </button>
      </div>
      <p className="mt-8 text-center text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] z-10">MEDBRIDGE AI-Vision OS · Verified Instance</p>
    </div>
  );
}
