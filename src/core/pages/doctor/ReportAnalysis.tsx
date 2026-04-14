import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle,
  Loader2, Download, RefreshCw, ZoomIn, ZoomOut,
  Microscope, Scan, ShieldCheck, Zap, Info, Activity,
  Database, LineChart, FileSearch
} from "lucide-react";
import { toast } from "sonner";

interface Biomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical";
  interpretation: string;
}

interface ReportResult {
  reportType: string;
  patientName: string;
  reportDate: string;
  summary: string;
  biomarkers: Biomarker[];
  conclusions: string[];
  recommendations: string[];
  urgency: "routine" | "careful" | "urgent";
}

const SEVERITY_COLORS = {
  normal: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  high: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  critical: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
};

export default function ReportAnalysis() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [apiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [zoom, setZoom] = useState(1);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setBase64((e.target?.result as string).split(",")[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeReport = async () => {
    if (!base64) { toast.error("No report selected"); return; }
    const cleanKey = apiKey.trim();
    if (!cleanKey) { toast.error("Please set Gemini API Key in Settings"); return; }

    setScanning(true);
    setResult(null);

    try {
      const prompt = `Analyze this lab/pathology report image. Extract all clinical biomarkers and values.
      Return ONLY a JSON object in this exact format:
      {
        "reportType": "Complete Blood Count / Lipid Profile / etc",
        "patientName": "string",
        "reportDate": "string",
        "summary": "Clinical summary of the report",
        "biomarkers": [
          {
            "name": "string",
            "value": "string (numeric)",
            "unit": "string (e.g. mg/dL)",
            "referenceRange": "string",
            "status": "normal|high|low|critical",
            "interpretation": "Short clinical note"
          }
        ],
        "conclusions": ["string"],
        "recommendations": ["string"],
        "urgency": "routine|careful|urgent"
      }`;

      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + cleanKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });

      if (!res.ok) throw new Error("AI Connection Failed");

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setResult(JSON.parse(rawText));
      toast.success("Pathology Extraction Complete");
    } catch (err: any) {
      toast.error("Deep Scan Failed. Check your API Key.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-medium selection:bg-rose-500/30">
      {/* Header */}
      <nav className="bg-black/60 backdrop-blur-2xl border-b border-white/[0.05] border-white/5 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ArrowLeft className="w-6 h-6 text-white" /></button>
            <div className="w-12 h-12 bg-rose-600/20 border border-rose-600/30 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/10">
              <Microscope className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Global Lab Core</h1>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-1.5">Pathology Intelligence Subsystem</p>
            </div>
          </div>
          {result && (
            <button className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3">
              <Download className="w-4 h-4" /> Export clinical DX
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-8 flex flex-col lg:flex-row gap-10">
        {/* Left: Uploader */}
        <div className="lg:w-[450px] space-y-8 shrink-0">
          <div 
            onClick={() => !preview && fileRef.current?.click()}
            className={`cursor-pointer rounded-[3rem] border-2 border-dashed transition-all relative overflow-hidden group h-[500px] flex flex-col items-center justify-center p-12 text-center
              ${preview ? 'border-white/10 bg-black' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/5'}`}
          >
            {!preview ? (
              <>
                <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-rose-500/10 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Mount Lab Report</h3>
                <p className="text-sm font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">DICOM, JPEG, PDF FEEDS // MAX 10MB</p>
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {['Blood', 'Urine', 'Lipid', 'Thyroid'].map(t => <span key={t} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-zinc-400">{t}</span>)}
                </div>
              </>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 rounded-[2rem] overflow-hidden">
                <img src={preview} alt="Scan" className="max-w-full max-h-full object-contain" style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }} />
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                   <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.2)); }} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 text-white transition-all"><ZoomIn className="w-5 h-5" /></button>
                   <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.2)); }} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-white/10 text-white transition-all"><ZoomOut className="w-5 h-5" /></button>
                   <button onClick={(e) => { e.stopPropagation(); setPreview(null); setBase64(null); setZoom(1); }} className="p-3 bg-rose-500/20 backdrop-blur-xl border border-rose-500/40 rounded-xl hover:bg-rose-500 hover:text-white text-rose-500 transition-all"><RefreshCw className="w-5 h-5" /></button>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
          </div>

          <button 
            disabled={!preview || scanning}
            onClick={analyzeReport}
            className="w-full py-6 bg-rose-600 rounded-[2rem] text-white font-black uppercase tracking-[0.3em] text-sm hover:bg-rose-500 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-rose-600/30 active:scale-[0.98]"
          >
            {scanning ? <><Loader2 className="w-6 h-6 animate-spin text-white" /> Matrix Engine Processing...</> : <><FileSearch className="w-6 h-6" /> Initialize Deep Pathology Scan</>}
          </button>
        </div>

        {/* Right: Analysis Results */}
        <div className="flex-1 bg-zinc-900/20 rounded-[3.5rem] border border-white/5 p-12 min-h-[700px] relative overflow-hidden backdrop-blur-3xl shadow-inner">
           <AnimatePresence mode="wait">
              {!result && !scanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center">
                   <div className="w-40 h-40 bg-white/[0.02] border border-white/5 rounded-[3rem] flex items-center justify-center mb-10 relative">
                     <Database className="w-20 h-20 text-rose-500/20" />
                     <div className="absolute inset-0 bg-rose-500/5 blur-3xl rounded-full" />
                   </div>
                   <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">Awaiting Clinical Data</h2>
                   <p className="max-w-md text-zinc-500 font-medium leading-relaxed uppercase tracking-widest text-[11px]">Neural core is offline. Please mount a pathology scan to begin real-time biomarker extraction and reference mapping.</p>
                </motion.div>
              )}

              {scanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center">
                   <div className="w-48 h-48 relative mb-12">
                      <div className="absolute inset-0 border-8 border-white/[0.02] rounded-full" />
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-8 border-transparent border-t-rose-600 rounded-full" 
                      />
                      <div className="absolute inset-6 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center shadow-3xl shadow-rose-600/20">
                         <LineChart className="w-16 h-16 text-rose-500 animate-pulse" />
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Engine Synchronizing</h3>
                   <div className="flex items-center gap-2 mt-3 overflow-hidden h-4">
                      <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] animate-pulse">Scanning Bio-Markers...</div>
                   </div>
                </motion.div>
              )}

              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                   {/* Summary Header */}
                   <div>
                      <div className="flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4"><ShieldCheck className="w-4 h-4" /> Triage Output</div>
                      <div className="flex items-end justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                         <div className="flex-1">
                            <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-4">{result.patientName}</h2>
                            <div className="flex items-center gap-6">
                               <span className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">{result.reportType}</span>
                               <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{result.reportDate}</span>
                            </div>
                         </div>
                         <div className={`px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] border shadow-2xl transition-all \${
                            result.urgency === 'urgent' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 
                            result.urgency === 'careful' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                         }`}>
                           {result.urgency} Priority
                         </div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                         <p className="text-lg font-medium text-zinc-300 leading-relaxed italic relative z-10">"{result.summary}"</p>
                      </div>
                   </div>

                   {/* Biomarkers Table */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black text-white uppercase tracking-tighter">Extracted Biomarkers</h3>
                         <div className="flex gap-4">
                            {['high','low','normal'].map(s => <div key={s} className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full \${SEVERITY_COLORS[s as keyof typeof SEVERITY_COLORS].split(' ')[0].replace('text-','bg-')}`} /><span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">{s}</span></div>)}
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {result.biomarkers.map((bio, idx) => (
                           <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-rose-500 transition-colors">{bio.name}</h4>
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Ref: {bio.referenceRange}</div>
                                 </div>
                                 <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border \${SEVERITY_COLORS[bio.status]}`}>
                                    {bio.status}
                                 </div>
                              </div>
                              <div className="flex items-end gap-3">
                                 <span className="text-3xl font-black text-white tracking-tighter">{bio.value}</span>
                                 <span className="text-[10px] font-black text-zinc-500 uppercase mb-1.5 tracking-widest">{bio.unit}</span>
                              </div>
                              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wide">
                                 {bio.interpretation}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Next Actions */}
                   <div className="grid lg:grid-cols-2 gap-8 pb-10">
                      <div className="bg-zinc-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
                         <div className="absolute top-4 left-4 p-2 bg-rose-600/10 rounded-xl"><Activity className="w-5 h-5 text-rose-500" /></div>
                         <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] pl-12 mb-6">Recommendations</h4>
                         <ul className="space-y-3">
                            {result.recommendations.map((r, i) => <li key={i} className="flex items-start gap-4 text-xs font-black text-white uppercase tracking-wide border-b border-white/5 pb-3"> <div className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 flex-shrink-0" /> {r}</li>)}
                         </ul>
                      </div>
                      <div className="bg-zinc-900/60 p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden">
                         <div className="absolute top-4 left-4 p-2 bg-blue-600/10 rounded-xl"><ShieldCheck className="w-5 h-5 text-blue-500" /></div>
                         <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] pl-12 mb-6">Clinical Verification</h4>
                         <ul className="space-y-3">
                            {result.conclusions.map((c, i) => <li key={i} className="flex items-start gap-4 text-xs font-black text-zinc-400 uppercase tracking-wide bg-white/5 p-4 rounded-xl"> {c}</li>)}
                         </ul>
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
