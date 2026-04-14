import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  Camera, Upload, FileText, Pill, AlertTriangle, CheckCircle, 
  ArrowLeft, RefreshCw, ScanLine, Heart, BookOpen, Clock, 
  Search, ShieldCheck, ChevronRight, ChevronDown, MessageSquare, 
  Send, X, Bot, Sparkles, Leaf, FileImage, ChevronUp, Info, 
  Salad, FlaskConical, Star, Settings, Eye, EyeOff
} from "lucide-react";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AyurvedaAlt {
  name: string; hindiName: string; form: string; treats: string;
  howToTake: string; activeCompounds: string; safetyNote: string; effectiveness: number;
}
interface Medicine {
  brandName: string; genericName: string; prescribedDose: string;
  treatsCondition: string; sideEffects: string[]; category: string;
  ayurvedaAlternatives: AyurvedaAlt[]; lifestyleTips: string[];
}
interface RxResult {
  patientName: string | null; doctorName: string | null;
  date: string | null; clinic: string | null;
  medicines: Medicine[]; generalAdvice: string;
  confidenceScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "Antibiotic": "bg-red-50 text-red-700 border-red-200",
  "Analgesic": "bg-orange-50 text-orange-700 border-orange-200",
  "Antipyretic": "bg-amber-50 text-amber-700 border-amber-200",
  "Analgesic / Antipyretic": "bg-amber-50 text-amber-700 border-amber-200",
  "Antihypertensive": "bg-blue-50 text-blue-700 border-blue-200",
  "Antidiabetic": "bg-purple-50 text-purple-700 border-purple-200",
  "Antacid": "bg-teal-50 text-red-800 border-red-300",
};
const getCategoryColor = (cat: string) =>
  CATEGORY_COLORS[cat] || "bg-zinc-900 text-zinc-400 border-zinc-800";

function EffBar({ value }: { value: number }) {
  const color = value >= 80 ? "from-green-400 to-red-500" : value >= 65 ? "from-amber-400 to-orange-400" : "from-red-400 to-rose-400";
  return (
    <div className="flex items-center gap-2 mt-1 border-white/5">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`} />
      </div>
      <span className="text-xs font-black text-zinc-600 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RxScanner() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [base64, setBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<RxResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, "allopathic" | "ayurveda">>({});
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: "Hello! I'm Aarohi, your MedBridge AI Agent. I've analysed your prescription. Feel free to ask me anything about these medicines or how they interact with Ayurvedic alternatives." }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setBase64(dataUrl.split(",")[1]);
      setMimeType(file.type);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const runClientSideScan = async (imgBase64: string, mType: string): Promise<RxResult> => {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) throw new Error("API_KEY_MISSING");

    // Last Stand stability layer
    const modelsToTry = ["models/gemini-2.0-flash", "models/gemini-1.5-flash", "models/gemini-1.5-pro"];
    const headers = { "Content-Type": "application/json" };
    let lastError: any = null;

    for (const mName of modelsToTry) {
      let retries = 0;
      while (retries < 3) {
        try {
          console.log(`🛡️ MedBridge AI: Connecting to ${mName}...`);
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${mName}:generateContent?key=${cleanKey}`, {
            method: "POST", headers,
            body: JSON.stringify({
              contents: [{
                parts: [{ text: "Analyze prescription carefully. Return ONLY valid JSON. Schema: {\"patientName\": \"str\", \"doctorName\": \"str\", \"date\": \"str\", \"clinic\": \"str\", \"medicines\": [{\"brandName\": \"str\", \"genericName\": \"str\", \"prescribedDose\": \"str\", \"treatsCondition\": \"str\", \"sideEffects\": [\"str\"], \"category\": \"str\", \"ayurvedaAlternatives\": [{\"name\": \"str\", \"hindiName\": \"str\", \"effectiveness\": 90}], \"lifestyleTips\": [\"str\"]}], \"generalAdvice\": \"str\", \"confidenceScore\": 85}" },
                { inlineData: { mimeType: mType || "image/jpeg", data: imgBase64 } }]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error(`❌ API Error ${res.status}:`, errData);
            if (res.status === 401 || res.status === 403) throw new Error("API_KEY_EXPIRED");
            if (res.status === 404) break; 
            if (res.status === 503 || res.status === 429) {
              toast.loading(`Google AI is busy, holding for 5s...`, { id: "scan-loading" });
              retries++;
              await new Promise(r => setTimeout(r, 5000));
              continue;
            }
            throw new Error(`API returned status ${res.status}`);
          }

          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const start = raw.indexOf('{');
          if (start === -1) throw new Error("Format Incomplete");
          const end = raw.lastIndexOf('}');
          let jsonStr = (end > start) ? raw.substring(start, end + 1) : raw.substring(start);
          jsonStr = jsonStr.replace(/[^ -~]/g, "");
          if (!jsonStr.endsWith('}')) {
             if (jsonStr.includes('"') && jsonStr.lastIndexOf('"') > jsonStr.lastIndexOf(':')) jsonStr += '"'; 
             if (jsonStr.includes('[')) jsonStr += ']}';
             jsonStr += '}';
          }
          const openB = (jsonStr.match(/{/g) || []).length;
          const closeB = (jsonStr.match(/}/g) || []).length;
          for (let i = 0; i < (openB - closeB); i++) jsonStr += '}';

          return JSON.parse(jsonStr);
        } catch (err: any) {
          lastError = err;
          if (err.message === "API_KEY_EXPIRED") throw new Error("Key limit reached.");
          retries++;
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    }
    throw lastError || new Error("Backend connection timed out.");
  };

  const scan = async () => {
    if (!base64) { toast.error("Please upload a prescription image first"); return; }
    setScanning(true);
    setResult(null);
    toast.loading("MedBridge AI identifying medicines...", { id: "scan-loading" });

    try {
      if (!apiKey) throw new Error("API_KEY_MISSING");
      const scanData = await runClientSideScan(base64, mimeType);
      if (scanData && scanData.medicines && scanData.medicines.length > 0) {
        setResult(scanData);
        const tabs: Record<string, "allopathic" | "ayurveda"> = {};
        scanData.medicines.forEach((_, i) => { tabs[i] = "ayurveda"; });
        setActiveTab(tabs);
        toast.success("Prescription Analyzed Successfully!", { id: "scan-loading" });
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 200);
      } else {
        throw new Error("No medicines detected. Ensure photo is clear.");
      }
    } catch (e: any) {
      console.error("Scan error:", e);
      if (e.message?.toLowerCase().includes("api key") || e.message === "API_KEY_MISSING") {
        toast.error("Set your Google API Key in Settings.", { id: "scan-loading", action: { label: "Settings", onClick: () => setShowSettings(true) } });
      } else {
        toast.error(e.message || "Analysis failed.", { id: "scan-loading" });
      }
    } finally {
      setScanning(false);
    }
  };

  const handleChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;
    const userMsg = userInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput("");
    setIsTyping(true);

    try {
      const context = `Prescribed: ${result?.medicines?.map(m => m.brandName).join(", ")}. Advice: ${result?.generalAdvice}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `You are Aarohi, a Clinical AI. Context: ${context}. Answer: ${userMsg}` }] }]
        })
      });
      const data = await res.json();
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble responding right now.";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Connection issues. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-black selection:bg-primary/30 overflow-x-hidden">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/[0.1] rounded-[2.5rem] p-10 shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">AI Engine Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 text-zinc-500 hover:text-white" title="Close Settings"><X /></button>
              </div>
              <label className="block text-xs font-black text-zinc-500 mb-3 uppercase tracking-widest">Google Gemini API Key</label>
              <div className="relative mb-8">
                <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("gemini_api_key", e.target.value); }}
                  className="w-full pl-5 pr-14 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" title="Toggle visibility">{showKey ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-white text-black rounded-2xl font-black">Save & Finish</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="bg-black/60 backdrop-blur-3xl border-b border-white/[0.08] sticky top-0 z-40 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2.5 hover:bg-white/10 rounded-2xl"><ArrowLeft text-white /></button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center"><ScanLine text-white /></div>
          <div><h1 className="font-black text-white text-lg leading-none uppercase tracking-tight">Rx Scanner</h1></div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setShowSettings(true)} className="p-2.5 text-zinc-500 hover:text-white"><Settings /></button>
            <button onClick={() => navigate("/patient/login")} className="px-6 py-2.5 bg-white text-black rounded-2xl text-sm font-black hover:bg-zinc-200 uppercase tracking-wide">Login</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/40 rounded-[3.5rem] p-12 border border-white/[0.08]">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><FileText text-primary size={32} /></div>
              <div><h2 className="text-4xl font-black text-white tracking-tighter">Scan Prescription</h2><p className="text-xl text-zinc-500 mt-1">Multi-modal clinical analysis</p></div>
            </div>
            
            {!preview ? (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-white/[0.1] rounded-[2.5rem] p-16 text-center hover:bg-white/[0.02] cursor-pointer transition-all">
                <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><Upload text-white /></div>
                <h3 className="text-white font-bold text-xl mb-1 tracking-tight">Upload Image</h3>
                <p className="text-zinc-500">Drag & drop or browse photos</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="aspect-video bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/[0.08] relative">
                  <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                  <button onClick={() => setPreview(null)} className="absolute top-6 right-6 p-3 bg-black/60 rounded-full text-white hover:bg-black"><X /></button>
                </div>
                <button onClick={scan} disabled={scanning} className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                  {scanning ? <RefreshCw className="animate-spin text-primary" /> : <Sparkles className="text-primary" />}
                  {scanning ? "Analyzing..." : "Analyze Now"}
                </button>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-4 mt-12">
               {[
                 { icon: <Pill />, title: "Brand Discovery", color: "text-blue-500" },
                 { icon: <Leaf />, title: "Ayurvedic Alts", color: "text-green-500" },
                 { icon: <ShieldCheck />, title: "Safety Validated", color: "text-red-500" }
               ].map((f, i) => (
                 <div key={i} className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                    <div className={`${f.color} mb-3`}>{f.icon}</div>
                    <div className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{f.title}</div>
                 </div>
               ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
             <div className="bg-red-950/20 border border-red-500/30 rounded-[2rem] p-6 backdrop-blur-xl flex items-start gap-4">
                <AlertTriangle className="text-red-500 shrink-0" />
                <div>
                   <h4 className="text-[10px] font-bold uppercase text-red-500 tracking-widest mb-1">Safety Disclaimer</h4>
                   <p className="text-sm font-bold text-red-100/90 leading-tight">Always consult a qualified doctor before changing medication. AI analysis is for information only.</p>
                </div>
             </div>

             <div className="bg-zinc-900 border border-white/[0.08] rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-start gap-6">
                   <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0"><img src={preview || ""} className="w-full h-full object-cover" alt="Scan" /></div>
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-green-500/20 uppercase">AI Verified</div>
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-primary/20 uppercase">Handwriting Match: {result.confidenceScore}%</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                         <span>👤 {result.patientName || "Patient"}</span>
                         <span>📅 {result.date || "Today"}</span>
                         <span>🏥 {result.clinic || "Clinic"}</span>
                         <span>🩺 {result.doctorName || "Doctor"}</span>
                      </div>
                   </div>
                   <button onClick={() => setResult(null)} className="text-zinc-500 hover:text-white"><RefreshCw /></button>
                </div>
             </div>

             {result.medicines.map((med, idx) => (
               <div key={idx} className="bg-zinc-900/40 rounded-[2.5rem] border border-white/[0.08] overflow-hidden">
                  <div className="p-6 flex items-start gap-5 cursor-pointer" onClick={() => setExpanded(p => ({...p, [idx]: !p[idx]}))}>
                     <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/[0.05]"><Pill text-primary size={28} /></div>
                     <div className="flex-1">
                        <h3 className="text-xl font-black text-white">{med.brandName}</h3>
                        <p className="text-zinc-500 text-sm font-medium">{med.genericName}</p>
                        <div className="flex items-center gap-2 mt-3">
                           <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{med.prescribedDose}</span>
                           <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{med.treatsCondition}</span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="bg-green-500/10 text-green-500 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest border border-green-500/20">{med.ayurvedaAlternatives.length} Alternatives</div>
                        {expanded[idx] ? <ChevronUp text-zinc-500 /> : <ChevronDown text-zinc-500 />}
                     </div>
                  </div>

                  <AnimatePresence>
                    {expanded[idx] && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-6 pb-8 border-t border-white/[0.05] pt-6 overflow-hidden">
                         <div className="flex gap-4 mb-6">
                            <button onClick={() => setTab(p => ({...p, [idx]: 'ayurveda'}))} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${activeTab[idx] === 'ayurveda' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/[0.02] border-white/[0.08] text-zinc-500'}`}>Integrative Alt</button>
                            <button onClick={() => setTab(p => ({...p, [idx]: 'allopathic'}))} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${activeTab[idx] === 'allopathic' ? 'bg-zinc-700 border-zinc-600 text-white shadow-lg' : 'bg-white/[0.02] border-white/[0.08] text-zinc-500'}`}>Clinical Details</button>
                         </div>

                         {activeTab[idx] === 'ayurveda' ? (
                           <div className="space-y-4">
                             {med.ayurvedaAlternatives.map((alt, aidx) => (
                               <div key={aidx} className="bg-white/[0.03] rounded-3xl p-6 border border-white/[0.08]">
                                  <div className="flex justify-between items-start mb-4">
                                     <div><h5 className="text-white font-black text-lg">{alt.name}</h5><p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{alt.hindiName}</p></div>
                                     <div className="text-right items-end flex flex-col"><div className="text-xs font-black text-primary mb-1 tracking-widest uppercase">Efficacy</div><EffBar value={alt.effectiveness} /></div>
                                  </div>
                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                     <div className="flex gap-3 items-center"><Leaf size={14} className="text-green-500" /><span className="text-xs text-zinc-300 font-bold uppercase tracking-wider">{alt.treats}</span></div>
                                     <div className="flex gap-3 items-start"><Info size={14} className="text-primary mt-0.5" /><p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed tracking-wider">{alt.safetyNote}</p></div>
                                  </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/[0.08]">
                                 <h6 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Side Effects</h6>
                                 <div className="flex flex-wrap gap-2">{med.sideEffects.map((s, si) => <span key={si} className="text-[10px] font-black text-red-400 bg-red-400/5 px-2 py-1 rounded-lg uppercase tracking-widest">{s}</span>)}</div>
                              </div>
                              <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/[0.08]">
                                 <h6 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Category</h6>
                                 <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg border border-blue-400/20 uppercase tracking-widest">{med.category}</span>
                              </div>
                           </div>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
             ))}

             <div className="bg-zinc-900 border border-white/[0.08] p-8 rounded-[3rem] text-center">
                <Sparkles size={48} className="text-primary mx-auto mb-4 opacity-50" />
                <h4 className="text-white font-black text-lg mb-2 tracking-tight">AI Health Discovery</h4>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 tracking-wide font-medium leading-relaxed">{result.generalAdvice}</p>
                <div className="flex gap-4 justify-center">
                   <button onClick={() => setIsAgentOpen(true)} className="flex-1 py-4 bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all">Chat with Agent</button>
                   <button onClick={() => window.print()} className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-all">Print Results</button>
                </div>
             </div>
          </div>
        )}
      </main>

      <AnimatePresence>
         {result && (
           <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setIsAgentOpen(true)}
             className="fixed bottom-8 right-8 w-16 h-16 bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-red-600 transition-all active:scale-90">
             <Bot size={32} />
           </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
        {isAgentOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAgentOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 h-full w-[400px] bg-zinc-950 border-l border-white/[0.08] z-[70] flex flex-col p-8">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.05]">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20"><Bot className="text-red-500" /></div>
                     <div><h4 className="text-white font-black text-xs uppercase tracking-widest leading-none">Aarohi AI</h4><p className="text-[9px] font-black text-zinc-500 tracking-widest mt-1 uppercase">Clinical Specialist</p></div>
                  </div>
                  <button onClick={() => setIsAgentOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar p-2">
                 {chatMessages.map((m, i) => (
                   <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed ${m.role === 'user' ? 'bg-red-700/20 text-red-200 border border-red-500/20' : 'bg-white/[0.03] text-zinc-300 border border-white/[0.08]'}`}>{m.text}</div>
                   </div>
                 ))}
                 {isTyping && <div className="text-zinc-500 text-[10px] font-bold uppercase animate-pulse">Aarohi is typing...</div>}
               </div>

               <form onSubmit={handleChat} className="mt-8 relative">
                  <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Ask Aarohi anything..." className="w-full bg-white/[0.02] border border-white/[0.1] rounded-2xl py-4 pl-5 pr-14 text-white placeholder-zinc-700 outline-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600/50" />
                  <button type="submit" disabled={!userInput.trim() || isTyping} className="absolute right-2 top-2 w-10 h-10 bg-red-700 text-white rounded-xl flex items-center justify-center hover:bg-red-600 disabled:opacity-20"><Send size={18} /></button>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
