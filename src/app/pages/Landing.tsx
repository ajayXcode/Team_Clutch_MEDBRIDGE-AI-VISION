import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Mic, Brain, Shield, Star, ArrowRight, Heart,
  Stethoscope, Users, Leaf, ScanLine, Upload,
  Sparkles, Pill, FlaskConical, Camera, Bot
} from "lucide-react";

import { BackgroundPaths } from "../components/ui/background-paths";
import { cn } from "../components/ui/utils";

const FEATURES = [
  { icon: Mic, title: "Voice AI Booking", desc: "Book appointments by speaking naturally. AI understands and confirms slots instantly.", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
  { icon: Brain, title: "AI Triage Nurse", desc: "Describe symptoms to our AI nurse. Structured summary sent to your doctor before consultation.", color: "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
  { icon: Activity, title: "ML Risk Scoring", desc: "XGBoost engine prioritises HIGH-risk patients. Critical cases always seen first.", color: "bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" },
  { icon: Shield, title: "ABHA Health ID", desc: "Create and link your national health identity. Access all your medical records in one place.", color: "bg-rose-600/10 text-rose-500 border border-rose-600/20 shadow-[0_0_15px_rgba(225,29,72,0.2)]" },
  { icon: Users, title: "Family Profiles", desc: "Manage health records and appointments for your entire family under one account.", color: "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]" },
  { icon: Stethoscope, title: "Digital Rx", desc: "Doctor sends prescription to your email instantly after consultation. Zero paper.", color: "bg-red-600/10 text-red-500 border border-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]" },
];

const STATS = [
  { value: "< 60s", label: "Booking" },
  { value: "< 5s", label: "AI summary" },
  { value: "< 2s", label: "Real-time alert" },
  { value: "100%", label: "Paperless" },
];

const SAMPLE_MEDICINES = [
  { brand: "Augmentin 625", ayurveda: "Giloy", eff: 78, form: "Kadha / Capsule", color: "from-rose-600 to-red-600" },
  { brand: "Dolo 650", ayurveda: "Sudarshan Ghanvati", eff: 82, form: "Tablet", color: "from-red-600 to-rose-700" },
];

const INDIAN_LANGS = [
  { text: "India", lang: "English" },
  { text: "भारत", lang: "Hindi" },
  { text: "இந்தியா", lang: "Tamil" },
  { text: "ಭಾರತ", lang: "Kannada" },
  { text: "భారతదేశం", lang: "Telugu" },
  { text: "ભારત", lang: "Gujarati" },
  { text: "ভারত", lang: "Bengali" },
  { text: "بھارت", lang: "Urdu" },
  { text: "भारत", lang: "Marathi" },
  { text: "ਭਾਰਤ", lang: "Punjabi" },
];

export default function Landing() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [langIndex, setLangIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % INDIAN_LANGS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreviewFile(e.target?.result as string);
    reader.readAsDataURL(file);
    setTimeout(() => navigate("/rx-scanner"), 600);
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-300 selection:bg-red-600/30 overflow-x-hidden">
      {/* Navbar - Ultra Glossy Glassmorphism */}
      <nav className="fixed top-0 w-full z-50 bg-white/[0.02] backdrop-blur-3xl border-b border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}
          >
            <div className="w-9 h-9 rounded-[0.8rem] flex items-center justify-center bg-gradient-to-tr from-red-600 to-rose-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform border border-rose-400/30">
              <Heart className="w-5 h-5 text-white drop-shadow-md" />
            </div>
            <span className="text-xl font-black uppercase tracking-widest text-white group-hover:text-red-500 transition-colors shadow-red-600">MEDBRIDGE</span>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 md:gap-4">
            <button onClick={() => navigate("/rx-scanner")}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-red-500 bg-red-600/10 hover:bg-red-600/20 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all border border-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <Sparkles className="w-3 h-3 text-red-400" /> Rx Scanner
            </button>
            <button onClick={() => navigate("/patient/login")} className="px-3 py-2 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[9px] transition-colors">
              Patient
            </button>
            <button onClick={() => navigate("/doctor/login")} className="px-3 py-2 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[9px] transition-colors">
              Doctor
            </button>
            <button onClick={() => navigate("/patient/register")} 
              className="relative group px-5 py-2 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] ml-2">
              Get Started
            </button>
          </motion.div>
        </div>
      </nav>

      <BackgroundPaths>
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-16 grid lg:grid-cols-2 gap-12 items-center z-10 w-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0.0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            className="flex flex-col gap-6 items-start justify-center"
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20 shadow-[0_0_30px_rgba(220,38,38,0.1)] backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-red-400" /> AI-Powered Telemedicine Platform
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white text-left max-w-4xl tracking-tighter uppercase leading-[1.1]">
              Healthcare <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">Reimagined</span><br />
              <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6">
                <span className="text-white">For</span>
                <div className="relative h-[1.1em] overflow-hidden inline-flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={langIndex}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="text-red-500 whitespace-nowrap inline-block"
                    >
                      {INDIAN_LANGS[langIndex].text}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </h1>
            
            <p className="font-bold text-sm md:text-base text-zinc-400 max-w-lg text-left leading-relaxed uppercase tracking-wider">
              Book appointments by voice. AI triage before consultation. Predictive risk models. Zero paper footprint.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <button onClick={() => navigate("/patient/register")} 
                className="flex items-center justify-center gap-3 group relative px-8 py-4 bg-red-600 text-black rounded-xl font-black text-xs uppercase tracking-widest overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all hover:bg-red-500 active:scale-95">
                <Mic className="w-4 h-4" /> Start as Patient
              </button>
              <button onClick={() => navigate("/doctor/login")} 
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.03] text-white border border-white/[0.1] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/[0.05] hover:border-white/[0.2] transition-all">
                <Stethoscope className="w-4 h-4 text-red-500" /> Doctor Portal
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative md:ml-auto w-full max-w-md hidden lg:block">
            {/* Dark Premium Triage Interface */}
            <div className="bg-[#09090b] backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/[0.08] p-7">
              <div className="flex items-center gap-3 mb-6 border-b border-white/[0.05] pb-4">
                <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="font-black text-white text-[11px] uppercase tracking-widest shadow-white">AI Triage Node</div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Aarohi Virtual Nurse</div>
                </div>
                <div className="ml-auto flex gap-1.5 px-3 py-1 bg-rose-600/10 border border-rose-600/20 rounded-md items-center">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Online</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-red-700/20 border border-red-600/30 text-red-200 rounded-2xl rounded-tl-[4px] px-4 py-3 text-[10px] font-black uppercase tracking-widest max-w-[240px] shadow-[0_0_15px_rgba(220,38,38,0.1)] leading-relaxed">
                  Hi! I'm Aarohi. Describe your symptoms.
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] text-zinc-300 rounded-2xl rounded-tr-[4px] px-4 py-3 text-[10px] font-black uppercase tracking-widest max-w-[200px] ml-auto leading-relaxed">
                  High fever and headache for 3 days.
                </div>
                <div className="bg-red-700/20 border border-red-600/30 text-red-200 rounded-2xl rounded-tl-[4px] px-4 py-3 text-[10px] font-black uppercase tracking-widest max-w-[240px] shadow-[0_0_15px_rgba(220,38,38,0.1)] leading-relaxed">
                  Neck stiffness or light sensitivity detected?
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-[0.6rem] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-[9px] text-amber-500/70 font-black uppercase tracking-[0.2em] mb-1">Threat Level</div>
                  <div className="flex items-center gap-3">
                    <div className="text-[12px] font-black text-amber-500 uppercase tracking-widest shadow-amber-500">Elevated</div>
                    <div className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Index: 0.54</div>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -bottom-6 -left-8 bg-[#09090b] backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/[0.1] p-4 min-w-48 z-10 hidden sm:block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center text-[10px] font-black text-red-500 uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.2)]">AS</div>
                <div>
                  <div className="text-[11px] font-black text-white uppercase tracking-widest">Anita Sharma</div>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Cardiology Node</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-white">4.9</span>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] ml-2 px-1.5 py-0.5 bg-rose-600/10 border border-rose-600/20 rounded">Active</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </BackgroundPaths>

      <section className="py-20 px-6 bg-[#030303] border-t border-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-rose-600/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600/10 text-rose-500 border border-rose-600/30 shadow-[0_0_15px_rgba(225,29,72,0.1)] rounded-lg text-[9px] font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" /> New Neural Module
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tighter mb-4 shadow-white">
                Prescription <br />
                <span className="bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">Deep Scan</span><br />
                Protocol
              </h2>
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider leading-relaxed mb-6 max-w-md">
                Feed raw optical data. AI extracts compounds and cross-references pure Ayurvedic alternatives.
              </p>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-10 max-w-md">
                <div className="flex items-center gap-2 mb-2">
                   <Shield className="w-4 h-4 text-amber-500" />
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Medical Disclaimer</span>
                </div>
                <p className="text-[9px] font-bold text-amber-500/80 uppercase leading-relaxed tracking-wider">
                  AI matches are for informational purposes only and do not constitute medical advice. Never replace prescribed medication without consulting your doctor.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: ScanLine, label: "OCR Extraction", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                  { icon: Leaf, label: "Ayurvedic Matches", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                  { icon: FlaskConical, label: "Dosage Syntax", text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                  { icon: Shield, label: "Contraindications", text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                ].map((item, i) => (
                  <div key={i} className={`bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] flex items-center gap-3 hover:${item.border} hover:bg-white/[0.04] transition-colors`}>
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center border ${item.border}`}><item.icon className={`w-4 h-4 ${item.text}`} /></div>
                    <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{item.label}</div>
                  </div>
                ))}
              </div>
              
              <button onClick={() => navigate("/rx-scanner")}
                className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-red-600 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 group">
                <ScanLine className="w-5 h-5" /> Initialize Scanner <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Right: Interactive Demo */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6">
              <div
                className={`bg-[#09090b] backdrop-blur-3xl rounded-[2rem] border-2 border-dashed p-10 text-center cursor-pointer transition-all ${dragOver ? "border-red-600/50 bg-red-600/10 scale-[1.02] shadow-[0_0_40px_rgba(220,38,38,0.2)]" : "border-white/[0.1] hover:border-red-600/30 hover:bg-white/[0.02]"}`}
                onClick={() => { fileRef.current?.click(); }} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                <div className="w-16 h-16 bg-red-600/20 border border-red-600/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(220,38,38,0.2)] group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2">Mount Optical Feed</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Drop JPEG / PNG matrix here</p>
                <div className="flex gap-4 justify-center">
                  <span className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.1)]"><Camera className="w-3.5 h-3.5" /> Sensor</span>
                  <span className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.1)]"><Upload className="w-3.5 h-3.5" /> Storage</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] text-center mb-4">Sample Output Matrix</p>
                {SAMPLE_MEDICINES.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white/[0.02] backdrop-blur rounded-[1.2rem] p-4 border border-white/[0.05] flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <Pill className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-black text-xs uppercase tracking-widest">{m.brand}</div>
                      <div className="flex items-center gap-2 mt-1 hidden sm:flex">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{m.ayurveda}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">({m.form})</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 border-l border-white/[0.05] pl-4">
                      <div className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Efficacy</div>
                      <div className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{m.eff}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats - Refined Minimal Design */}
      <section className="py-20 bg-[#050505] border-y border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/[0.05]">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="text-center px-4">
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter shadow-white">{s.value}</div>
                <div className="text-zinc-600 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] mt-2">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Compliance Protocol - Indian Standards */}
      <section className="py-12 bg-[#030303] border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-30 hover:opacity-100 transition-all duration-1000 cursor-default"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-red-600/20 bg-red-600/5 flex items-center justify-center rounded-lg">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex flex-col uppercase">
                <span className="text-[11px] font-black text-white tracking-[0.2em]">ABDM</span>
                <span className="text-[8px] font-bold text-zinc-500 tracking-[0.1em]">Integrated</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1 md:border-x md:border-white/[0.05] md:px-16">
              <span className="text-xl font-black text-white tracking-[0.1em]">DPDP ACT 2023</span>
              <span className="text-[9px] font-black tracking-[0.4em] text-zinc-500 uppercase">Compliant</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col uppercase">
                <span className="text-[10px] font-black text-white tracking-[0.2em]">ISO 27001</span>
                <span className="text-[8px] font-bold text-zinc-500 tracking-[0.1em]">Certified</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <Stethoscope className="w-9 h-9 text-red-500/80" />
               <div className="flex flex-col uppercase text-left">
                 <span className="text-[9px] font-black text-white tracking-[0.1em] leading-tight max-w-[120px]">MoHFW TELEMEDICINE</span>
                 <span className="text-[8px] font-bold text-zinc-500 tracking-[0.1em]">Guidelines Compliant</span>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Core */}
      <section className="py-24 px-6 bg-[#030303] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter uppercase shadow-white">Clinical Infrastructure</h2>
            <p className="text-xs md:text-sm text-zinc-500 max-w-2xl mx-auto uppercase tracking-widest font-bold">End-to-End Patient Life Cycle Management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} 
                className="group relative bg-[#09090b] border border-white/[0.05] rounded-[2rem] p-8 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-2xl">
                <div className={cn("relative w-12 h-12 rounded-xl flex items-center justify-center mb-6", f.color)}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white mb-3 tracking-tighter uppercase">{f.title}</h3>
                <p className="text-zinc-500 text-[11px] font-bold leading-relaxed uppercase tracking-widest">{f.desc}</p>
                <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center gap-2 text-white font-black uppercase tracking-widest text-[9px] opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  Inspect Module <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* WHO WE ARE - MISSION CORE */}
      {/* ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#050505] relative overflow-hidden border-t border-white/[0.03]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-red-600/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 to-purple-500/20 blur-3xl rounded-[3rem] opacity-50" />
             <div className="bg-[#09090b]/80 backdrop-blur-3xl rounded-[3rem] p-10 md:p-14 border border-white/[0.08] relative shadow-2xl overflow-hidden group">
                <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 mb-8 shadow-[0_0_20px_rgba(220,38,38,0.2)] group-hover:bg-red-600/20 transition-colors">
                   <Shield className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-6 leading-[1.1]">
                  <span className="text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">Mission Focus:</span> <br/>
                  Who We Are
                </h3>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] leading-[1.8] mb-8 max-w-md">
                  We are a collective of healthcare veterans and engineers building the digital backbone of Indian telemedicine. MedBridge operates at the intersection of clinical excellence and secure data synchronisation.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-red-600/50 pl-4">
                    <div className="text-2xl font-black text-white tracking-tighter">99.9%</div>
                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Uptime SLA</div>
                  </div>
                  <div className="border-l-2 border-purple-500/50 pl-4">
                    <div className="text-2xl font-black text-white tracking-tighter">AES-256</div>
                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Encryption Protocol</div>
                  </div>
                </div>
             </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-2 gap-4">
            {[
              { icon: Activity, color: "text-red-500", title: "Clinical Precision", trans: "group-hover:-translate-y-2", y: "0" },
              { icon: Shield, color: "text-red-500", title: "Data Sentinel", trans: "group-hover:-translate-y-2", y: "translate-y-8" },
              { icon: Stethoscope, color: "text-rose-500", title: "Provider Access", trans: "group-hover:-translate-y-2", y: "-translate-y-8" },
              { icon: Brain, color: "text-purple-400", title: "Neural Triage", trans: "group-hover:-translate-y-2", y: "0" }
            ].map((card, i) => (
              <div key={i} className={`bg-[#09090b] rounded-[2rem] border border-white/[0.05] p-6 flex flex-col items-center justify-center text-center hover:border-white/[0.15] transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)] h-48 group ${card.y}`}>
                <card.icon className={`w-8 h-8 ${card.color} mb-4 ${card.trans} transition-transform shadow-${card.color.split("-")[1]}-500`} />
                <div className="text-[10px] font-black text-white uppercase tracking-widest">{card.title}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* OUR CLINICAL DEPARTMENTS - CLINICAL NODES */}
      {/* ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#030303] relative border-t border-white/[0.03] overflow-hidden">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/10 text-red-400 border border-red-600/30 shadow-[0_0_15px_rgba(220,38,38,0.1)] rounded-lg text-[9px] font-black uppercase tracking-widest mb-6">
                <Users className="w-3 h-3" /> clinical specialties
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter uppercase shadow-white">Clinical Departments</h2>
              <p className="text-xs md:text-sm text-zinc-500 max-w-2xl mx-auto uppercase tracking-widest font-bold">Delivering specialized medical services across all regions.</p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Cardiology", desc: "Heart & Vascular", icon: Heart, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
                { name: "Neurology", desc: "Brain & Nerves", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                { name: "Pediatrics", desc: "Child Health", icon: Users, color: "text-rose-500", bg: "bg-rose-600/10", border: "border-rose-600/20" },
                { name: "Orthopedics", desc: "Bone & Joint", icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                { name: "Dermatology", desc: "Skin & Hair", icon: Sparkles, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
                { name: "Psychiatry", desc: "Mental Health", icon: Brain, color: "text-red-500", bg: "bg-red-600/10", border: "border-red-600/20" },
                { name: "Oncology", desc: "Cancer Care", icon: Shield, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                { name: "General", desc: "Primary Care", icon: Stethoscope, color: "text-red-500", bg: "bg-red-600/10", border: "border-red-600/20" },
              ].map((dep, i) => (
                 <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="relative p-6 bg-[#09090b] rounded-[1.5rem] border border-white/[0.05] hover:border-white/[0.15] hover:bg-white/[0.02] transition-all group overflow-hidden cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-12 -mt-12 opacity-50 transition-transform group-hover:scale-[2] ${dep.bg}`} />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 border ${dep.bg} ${dep.border}`}>
                       <dep.icon className={`w-5 h-5 drop-shadow-[0_0_10px_currentColor] ${dep.color}`} />
                    </div>
                    <div className="relative z-10">
                       <h4 className="text-white font-black text-[11px] uppercase tracking-[0.2em] mb-1 group-hover:text-amber-400 transition-colors">{dep.name}</h4>
                       <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{dep.desc}</p>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase shadow-white">Integrate Now</h2>
          <p className="text-xs md:text-sm text-zinc-500 mb-12 max-w-xl mx-auto font-bold uppercase tracking-widest">A digital link to a streamlined health data future.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => navigate("/patient/register")} 
              className="flex items-center gap-3 px-10 py-5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 group border border-white">
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" /> Register Node
            </button>
            <button onClick={() => navigate("/doctor/login")} 
              className="flex items-center gap-3 px-10 py-5 bg-red-600/10 text-red-500 border border-red-600/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600/20 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
              <Stethoscope className="w-5 h-5" /> Provider Interface
            </button>
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 bg-black border-t border-white/[0.05] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          {/* Trust Badges / Compliance Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 border-b border-white/[0.05] pb-16">
            <div className="text-center md:text-left space-y-3">
              <div className="w-10 h-10 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">DPDP Act 2023 Compliant</h4>
              <p className="text-[9px] font-medium text-zinc-500 max-w-[200px] mx-auto md:mx-0 leading-relaxed uppercase tracking-wider">
                Strict adherence to Digital Personal Data Protection standards for Indian citizens.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">ABDM Integrated</h4>
              <p className="text-[9px] font-medium text-zinc-500 max-w-[200px] mx-auto leading-relaxed uppercase tracking-wider">
                Full Ayushman Bharat Digital Mission stack integration for ABHA ID & health records.
              </p>
            </div>
            <div className="text-center md:text-right space-y-3">
              <div className="w-10 h-10 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto md:ml-auto md:mr-0">
                <Bot className="w-5 h-5 text-red-500" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Medical AI Ethics</h4>
              <p className="text-[9px] font-medium text-zinc-500 max-w-[200px] mx-auto md:ml-auto md:mr-0 leading-relaxed uppercase tracking-wider">
                Aarohi agent trained for ethical triage and clinical decision support.
              </p>
            </div>
          </div>

          <div className="text-center">
            {/* Multilingual India Text */}
            <div className="mb-8">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-2">Healthcare Reimagined For</p>
              <div className="h-8 flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ y: [0, -32, -64, -96, -128, -160, -192] }}
                  transition={{ 
                    duration: 12, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    times: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1]
                  }}
                  className="flex flex-col gap-0"
                >
                  {["India", "भारत", "இந்தியா", "ఇండియా", "ಭಾರత", "ഭാരതം", "India"].map((lang, idx) => (
                    <span key={idx} className="h-8 flex items-center justify-center text-xl font-black italic tracking-tighter text-white uppercase shadow-red-500/20 drop-shadow-2xl">
                      {lang}
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-8">
              <span className="hover:text-zinc-500 transition-colors cursor-default">Core: Gemini 2.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 self-center"></span>
              <span className="hover:text-zinc-500 transition-colors cursor-default">Auth: Supabase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 self-center"></span>
              <span className="hover:text-zinc-500 transition-colors cursor-default">Motion: Framer</span>
            </div>

            <div className="flex justify-center gap-8 mb-10">
              <button 
                onClick={() => navigate("/privacy")} 
                className="group relative px-4 py-2"
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Privacy Policy</span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
              <button 
                onClick={() => navigate("/terms")} 
                className="group relative px-4 py-2"
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Terms of Service</span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 py-2 px-6 bg-white/[0.03] border border-white/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">System Status: Operational</span>
              </div>
              <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">© 2026 MedBridge // Integrated Clinical OS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
