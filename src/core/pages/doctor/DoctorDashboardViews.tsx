import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Scan, Brain, Microscope, FileImage, ChevronRight, Zap, Users, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Bar } from "recharts";

export function DiagnosticsView() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/[0.08] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Clinical Diagnostics</h3>
            <p className="text-zinc-500 font-medium tracking-tight mt-1 text-sm uppercase tracking-widest">Neural Scan & Pathology Hub</p>
          </div>
          <button onClick={() => navigate("/doctor/imaging")} className="px-8 py-4 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-primary/20 flex items-center gap-3">
             <Scan className="w-4 h-4" /> Start Neural Scan
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {[
            { patient: "Sunita Verma", type: "X-Ray Chest", status: "Analysis Complete", time: "10 mins ago", color: "text-primary", icon: Scan },
            { patient: "Rajesh Kumar", type: "Brain MRI", status: "Processing Node 4", time: "34 mins ago", color: "text-blue-400", icon: Brain },
            { patient: "Amit Singh", type: "Blood Panel", status: "Flagged: Critical", time: "1 hour ago", color: "text-red-500", icon: Microscope },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-[2rem] hover:bg-white/[0.05] transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                 <div className={`w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}><item.icon size={20} /></div>
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.time}</span>
              </div>
              <h4 className="text-white font-black uppercase tracking-tight mb-1">{item.patient}</h4>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{item.type}</p>
              <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${item.status.includes('Critical') ? 'text-red-500' : 'text-primary'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${item.status.includes('Critical') ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                 {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] p-8">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Pathology Integration Feed</h4>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} onClick={() => navigate("/doctor/reports")} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl cursor-pointer hover:bg-white/[0.05] transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-rose-500 transition-colors"><FileImage size={18} /></div>
                     <div className="flex-1">
                        <div className="text-xs font-black text-white uppercase tracking-tight">Lab Report #{742 + i}</div>
                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Verified by Clinical AI</div>
                     </div>
                     <button className="p-2 text-zinc-500 group-hover:text-primary transition-colors"><ChevronRight size={20} /></button>
                  </div>
                ))}
            </div>
         </div>
         <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6"><Zap size={32} /></div>
            <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Neural Cross-Reference</h4>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs">AI is currently cross-referencing 124 path-reports with patient histories for proactive anomaly detection.</p>
         </div>
      </div>
    </motion.div>
  );
}

export function AnalyticsView() {
  const data = [
    { name: 'Mon', consultations: 12, efficiency: 84 },
    { name: 'Tue', consultations: 19, efficiency: 91 },
    { name: 'Wed', consultations: 15, efficiency: 88 },
    { name: 'Thu', consultations: 22, efficiency: 95 },
    { name: 'Fri', consultations: 18, efficiency: 89 },
    { name: 'Sat', consultations: 9, efficiency: 92 },
    { name: 'Sun', consultations: 4, efficiency: 98 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
       <div className="grid lg:grid-cols-3 gap-6">
          {[
            { label: "Total Consultations", val: "1,284", change: "+12.4%", icon: Users, color: "text-blue-400" },
            { label: "AI Accuracy Rate", val: "99.2%", change: "+0.3%", icon: Brain, color: "text-primary" },
            { label: "Avg Process Time", val: "14m", change: "-2m", icon: Clock, color: "text-purple-400" },
          ].map((stat, i) => (stat &&
            <div key={i} className="bg-zinc-900/40 border border-white/[0.08] p-8 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
               <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center ${stat.color}`}><stat.icon size={24} /></div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
               </div>
               <div className="flex items-end justify-between items-baseline">
                  <div className="text-4xl font-black text-white tracking-tighter">{stat.val}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${stat.change.startsWith('+') ? 'text-primary' : stat.change.startsWith('-') ? 'text-blue-400' : 'text-zinc-500'}`}>{stat.change}</div>
               </div>
            </div>
          ))}
       </div>

       <div className="bg-zinc-900/40 rounded-[3rem] border border-white/[0.08] p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Productivity Vectors</h3>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">Weekly Consultation & Efficiency Metrics</p>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Efficiency</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" /><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Consultations</span></div>
             </div>
          </div>
          
          <div className="h-[400px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                   <defs>
                      <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }} />
                   <RechartsTooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", color: "#fff" }} />
                   <Area type="monotone" dataKey="efficiency" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorEff)" />
                   <Bar dataKey="consultations" fill="#3b82f6" opacity={0.2} radius={[10, 10, 10, 10]} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] p-8 group overflow-hidden relative">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">AI Copilot Impact</h4>
             <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-6 relative z-10">Neural assistance has reduced high-risk patient processing time by 42% over the last 30 days. Predictive triage is now 98.4% accurate.</p>
             <button className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hover:tracking-[0.4em] transition-all relative z-10">Download Detailed PDF Hub</button>
          </div>
          <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] p-8 flex items-center justify-between">
             <div>
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Queue Saturation</h4>
                <div className="text-3xl font-black text-white tracking-tighter leading-none mt-2">Optimal</div>
             </div>
             <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className={`w-3 h-10 rounded-full ${i < 5 ? 'bg-primary' : 'bg-white/5'}`} />)}
             </div>
          </div>
       </div>
    </motion.div>
  );
}
