import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Heart, Music, BookOpen, Star, ArrowRight, Home, X, AlertTriangle } from "lucide-react";

const AFFIRMATIONS = [
  "Your health matters. You took a great step today.",
  "You are not alone. Your doctor will be fully prepared for you.",
  "Taking care of yourself is the most important thing you can do.",
  "Every step towards health is a step in the right direction.",
];

const HEALTH_TIPS = [
  "Stay Hydrated: Drink water frequently. It keeps your joints lubricated and helps your body function properly.",
  "Deep Breathing: Take 5 deep breaths while waiting. It lowers heart rate and reduces stress.",
  "Stretch Regularly: Gently stretch your neck and shoulders to release tension while sitting.",
  "Rest Your Eyes: Look away from your screen every 20 minutes to reduce eye strain.",
  "Eat Whole Foods: An apple or a handful of almonds are great power snacks.",
  "Maintain Good Posture: Sit up straight while waiting. It prevents backache and fatigue.",
  "Walk a Little: Short 5-minute walks improve blood circulation drastically.",
  "Focus on Positivity: Think of three things you are grateful for today.",
  "Sanitize Hands: Always keep a small sanitizer handy to prevent infections in clinics.",
  "Ask Questions: Write down 2-3 questions you want to ask your doctor today.",
];

const CALMING_SONGS = [
  { title: "Weightless - Marconi Union", desc: "Proven to reduce anxiety significantly." },
  { title: "Electra - Airstream", desc: "A soft, ambient electronic track." },
  { title: "Watermark - Enya", desc: "Soothing vocals and gentle melodies." },
  { title: "Mellomaniac (Chill Out Mix) - DJ Shah", desc: "Relaxing atmospheric vibes." },
  { title: "Clair de Lune - Claude Debussy", desc: "Classic, peaceful piano." },
  { title: "Strawberry Swing - Coldplay", desc: "Acoustic and highly relaxing." },
  { title: "Please Don't Go - Barcelona", desc: "Soft piano and gentle vocals." },
  { title: "Pure Shores - All Saints", desc: "Relaxing pop with soothing pads." },
  { title: "Someone Like You - Adele", desc: "Slow tempo and calming voice." },
  { title: "Canzonetta Sull'aria - Mozart", desc: "Classical masterpiece for calmness." },
];

export default function CheckInComplete() {
  const navigate = useNavigate();
  const [view, setView] = useState<"main" | "music" | "tips">("main");
  const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-rose-600/30">
      {/* Automated Calming Background Music */}
      <audio autoPlay loop hidden>
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" type="audio/mpeg" />
      </audio>

      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative pb-16 z-10">
        <AnimatePresence mode="wait">
          {view === "main" ? (
            <motion.div key="main" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 20 }}>
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15 }} className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Check-In Synchronized</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Provider dashboard populated successfully</p>
              </motion.div>

              {/* Status Cards */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3 mb-8">
                {[
                  { icon: CheckCircle, text: "AI triage summary generated", color: "text-rose-500 border-rose-600/20 bg-rose-600/10" },
                  { icon: CheckCircle, text: "Risk parameters calculated", color: "text-red-500 border-red-600/20 bg-red-600/10" },
                  { icon: CheckCircle, text: "Real-time clinical queue updated", color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${item.color} backdrop-blur-sm`}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Sukoon Wellness Corner */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-zinc-900/60 backdrop-blur-[40px] rounded-3xl border border-white/[0.08] shadow-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-300">Sukoon Wellness Node</h3>
                </div>
                <p className="text-[11px] font-medium text-zinc-400 leading-relaxed italic mb-6">"{affirmation}"</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setView("music")} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 text-center cursor-pointer hover:bg-white/[0.05] hover:border-purple-500/30 transition-all group">
                    <Music className="w-6 h-6 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-200">Ambient Frequencies</div>
                    <div className="text-[8px] font-bold text-zinc-500 mt-1.5 uppercase">Reduce Anxiety</div>
                  </button>
                  <button onClick={() => setView("tips")} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 text-center cursor-pointer hover:bg-white/[0.05] hover:border-blue-500/30 transition-all group">
                    <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-200">Health Protocol</div>
                    <div className="text-[8px] font-bold text-zinc-500 mt-1.5 uppercase">Queue Wait Guide</div>
                  </button>
                </div>
                {/* Breathing animation */}
                <div className="mt-8 text-center pb-2">
                  <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full mx-auto flex items-center justify-center border border-white/10 blur-[2px]">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-[1px]" />
                  </motion.div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-4">Inhale... Exhale...</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs font-medium text-amber-300">
                  <Star className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Please arrive 5-10 minutes prior to your scheduled block.</span>
                </div>
                <button onClick={() => navigate("/patient/dashboard")}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] group">
                  <Home className="w-4 h-4" /> Terminate Flow <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          ) : view === "music" ? (
            <motion.div key="music" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="bg-zinc-900/80 backdrop-blur-[40px] rounded-[2rem] shadow-2xl border border-white/[0.08] overflow-hidden">
               <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 px-6 py-5 flex items-center justify-between border-b border-white/[0.05]">
                 <div className="flex items-center gap-3"><Music className="w-5 h-5 text-purple-300"/> <span className="text-xs font-black uppercase tracking-widest text-white">Aural Therapy</span></div>
                 <button onClick={() => setView("main")} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X className="w-4 h-4 text-zinc-400"/></button>
               </div>
               <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                 {CALMING_SONGS.map((song, i) => (
                   <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/[0.03] rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-white/[0.05]">
                     <div className="w-10 h-10 bg-white/[0.05] text-purple-400 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 group-hover:bg-purple-500/20 transition-colors border border-white/[0.05]">{i+1}</div>
                     <div>
                       <h4 className="text-xs font-black tracking-wide text-white mb-1 uppercase">{song.title}</h4>
                       <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{song.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          ) : (
            <motion.div key="tips" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="bg-zinc-900/80 backdrop-blur-[40px] rounded-[2rem] shadow-2xl border border-white/[0.08] overflow-hidden">
               <div className="bg-gradient-to-r from-blue-900/50 to-teal-900/50 px-6 py-5 flex items-center justify-between border-b border-white/[0.05]">
                 <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-blue-300"/> <span className="text-xs font-black uppercase tracking-widest text-white">Protocol Manual</span></div>
                 <button onClick={() => setView("main")} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X className="w-4 h-4 text-zinc-400"/></button>
               </div>
               <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                 {HEALTH_TIPS.map((tip, i) => (
                   <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                     <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/30">
                       <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                     </div>
                     <p className="text-xs font-medium text-zinc-300 leading-relaxed">{tip}</p>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Disclaimer Tooltip / Label */}
      <div className="absolute bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-20">
        <div className="bg-zinc-900/60 backdrop-blur-[20px] rounded-2xl p-4 border border-white/[0.05] flex items-start gap-3 shadow-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed">
            <strong className="text-zinc-200">System Disclaimer:</strong> Autonomous triage is assistive formulation. Output integrity requires absolute validation by clinical personnel.
          </p>
        </div>
      </div>
    </div>
  );
}
