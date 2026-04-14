import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Upload, Heart, Brain, AlertTriangle, CheckCircle,
  Loader2, Download, RefreshCw, ZoomIn, ZoomOut, Maximize2,
  Eye, Layers, Activity, Stethoscope, FileImage, ChevronRight,
  Microscope, Scan, ShieldCheck, Info, Zap, FileSearch
} from "lucide-react";
import { toast } from "sonner";

// Keep existing DEMO_SCENARIOS logic
const DEMO_SCENARIOS: Record<string, ImagingResult> = {
  "Wrist Fracture": {
    imageType: "X-Ray", bodyRegion: "Extremity (Wrist)", laterality: "Lateral",
    qualityScore: 94, overallAssessment: "Abnormal",
    primaryFindings: "There is a clear transverse fracture through the distal metaphysis of the radius, likely a Colles' fracture. Moderate displacement noted.",
    findings: [{ region: "Distal Radius", observation: "Transverse fracture with dorsal angulation and displacement.", severity: "severe", confidence: 98 }, { region: "Ulna", observation: "Associated styloid process fracture noted.", severity: "moderate", confidence: 85 }],
    abnormalities: ["Distal radius fracture", "Ulnar styloid fracture"], normalStructures: ["Carpal bones intact"],
    recommendations: ["Orthopedic consultation recommended", "Immediate splinting"], urgency: "urgent",
    differentialDiagnosis: ["Colles' Fracture", "Smith's Fracture"], technicalNotes: "Optimal exposure, slight rotation in lateral view."
  },
  "Chest Pneumonia": {
     imageType: "X-Ray", bodyRegion: "Chest", laterality: "PA",
     qualityScore: 92, overallAssessment: "Abnormal",
     primaryFindings: "Bilateral patchy opacities noted in the lower lobes consistent with multi-focal pneumonia. No pneumothorax detected.",
     findings: [{ region: "Right Lower Lobe", observation: "Consolidation with air bronchograms.", severity: "moderate", confidence: 88 }],
     abnormalities: ["Bilateral pulmonary opacities"], normalStructures: ["Trachea midline"],
     recommendations: ["Antibiotic therapy", "Sputum culture"], urgency: "routine",
     differentialDiagnosis: ["Bacterial Pneumonia", "Viral Pneumonitis"], technicalNotes: "Good inspiratory effort"
  }
};

interface Finding { region: string; observation: string; severity: "normal" | "mild" | "moderate" | "severe" | "critical"; confidence: number; }
interface ImagingResult {
  imageType: string; bodyRegion: string; laterality: string; qualityScore: number;
  overallAssessment: string; primaryFindings: string; findings: Finding[]; abnormalities: string[];
  normalStructures: string[]; recommendations: string[]; urgency: "routine" | "urgent" | "emergent";
  differentialDiagnosis: string[]; technicalNotes: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  normal: "bg-rose-600/10 text-rose-500 border-rose-600/20",
  mild: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  moderate: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  severe: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
};

export default function ImagingAnalysis() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [apiKey] = useState(() => localStorage.getItem("gemini_api_key") || (import.meta as any).env.VITE_GEMINI_API_KEY || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ImagingResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"findings" | "differential" | "recommendations">("findings");

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Unsupported filetype"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Data exceeds 8MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setBase64((e.target?.result as string).split(",")[1]);
      setMimeType(file.type);
      setResult(null);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); };

  const analyze = async (scenarioOverride?: string) => {
    if (!base64 && !scenarioOverride) { toast.error("No target selected"); return; }
    
    if (scenarioOverride && DEMO_SCENARIOS[scenarioOverride]) {
      setScanning(true);
      await new Promise(r => setTimeout(r, 2000));
      setResult(DEMO_SCENARIOS[scenarioOverride]);
      setScanning(false);
      return;
    }

    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) { toast.error("API Key not found in settings"); return; }

    setScanning(true);
    setResult(null);

    try {
      const prompt = `Analyze this medical image (X-Ray/MRI/CT). Provide a detailed clinical report.
      IMPORTANT: Return ONLY valid JSON in this structure:
      {
        "imageType": "string",
        "bodyRegion": "string",
        "laterality": "string",
        "qualityScore": number (0-100),
        "overallAssessment": "string",
        "primaryFindings": "string",
        "findings": [{"region": "string", "observation": "string", "severity": "normal|mild|moderate|severe|critical", "confidence": number}],
        "abnormalities": ["string"],
        "normalStructures": ["string"],
        "recommendations": ["string"],
        "urgency": "routine|urgent|emergent",
        "differentialDiagnosis": ["string"],
        "technicalNotes": "string"
      }`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType || "image/jpeg", data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "AI Connection Failed");
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty AI response");

      setResult(JSON.parse(rawText));
      toast.success("Analysis Complete");
    } catch (err: any) {
      console.error("Imaging Analysis Error:", err);
      toast.error(err.message || "Deep Scan Failed");
    } finally {
      setScanning(false);
    }
  };

  const exportReport = () => { toast.success("Feed Exported"); };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-red-600/30">
      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} title="Back" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
          <div className="w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center"><Scan className="w-4 h-4 text-blue-400" /></div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Deep Scan Core</h1>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em]">Radiology Subsystem</p>
          </div>
        </div>
        {result && (
          <button onClick={exportReport} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 group">
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Export Vector
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Upload + Preview */}
        <div className="w-[420px] bg-zinc-950/80 border-r border-white/[0.05] flex flex-col shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 z-10 p-5">
          <div 
            onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => !preview && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-[2rem] transition-all relative overflow-hidden group 
              ${dragOver ? "border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.2)]" 
              : preview ? "border-white/[0.1] bg-black cursor-default" 
              : "border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/50 cursor-pointer p-10 text-center"}`}
          >
            {!preview ? (
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <FileImage className="w-10 h-10 text-blue-400" />
                </div>
                <p className="font-black text-white text-sm uppercase tracking-widest mb-2">Drop Target Scan</p>
                <div className="flex flex-wrap justify-center gap-2 text-[9px] font-black uppercase tracking-widest mt-2 mb-4">
                  {["X-Ray", "MRI", "CT", "Ultrasound"].map(t => <span key={t} className="px-3 py-1.5 bg-white/[0.05] text-zinc-400 rounded-lg border border-white/[0.02]">{t}</span>)}
                </div>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">JPEG, PNG, WEBP // MAX 8MB</p>
              </div>
            ) : (
              <div className="relative h-64 bg-black flex items-center justify-center">
                <img ref={imgRef} src={preview} alt="Scan" className="max-w-full max-h-full object-contain" style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }} />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.2)); }} title="Zoom Out" className="p-2 bg-black/80 backdrop-blur border border-white/[0.1] hover:bg-white/10 text-white rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setZoom(1); }} title="Reset Zoom" className="px-3 py-2 bg-black/80 backdrop-blur border border-white/[0.1] hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{Math.round(zoom * 100)}%</button>
                  <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.2)); }} title="Zoom In" className="p-2 bg-black/80 backdrop-blur border border-white/[0.1] hover:bg-white/10 text-white rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} className="absolute top-3 right-3 p-2 bg-black/80 backdrop-blur border border-white/[0.1] hover:bg-white/10 text-white rounded-lg transition-colors" title="Change Target"><RefreshCw className="w-4 h-4" /></button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f) processFile(f); }} />
          </div>

          {preview && (
            <div className="mt-5 space-y-4">
              <button onClick={() => analyze()} disabled={scanning} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.3)] active:scale-95 transition-all group">
                {scanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Cross-Referencing Elements...</> : <><Microscope className="w-5 h-5 group-hover:scale-110 transition-transform" /> Execute Deep Scan</>}
              </button>
              
              <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3"><Zap className="w-4 h-4" /> Load Simulation Model</h4>
                <div className="grid grid-cols-1 gap-3">
                  {Object.keys(DEMO_SCENARIOS).map(s => (
                    <button key={s} onClick={() => analyze(s)} className="flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-blue-500/30 rounded-xl transition-colors group">
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-blue-400 transition-colors uppercase tracking-wide">{s}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{result.imageType}</div>
                    <div className="text-xl font-black text-white uppercase tracking-wide">{result.bodyRegion}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{result.laterality} View</div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${result.urgency === 'emergent' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/[0.1] text-white border border-white/[0.1]'}`}>{result.urgency}</span>
                </div>
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center justify-between">Scan Quality <span>{result.qualityScore}%</span></div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/[0.05]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.qualityScore}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500 rounded-full" />
                </div>
              </div>
              
              <div className={`p-4 border rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${result.overallAssessment.toLowerCase().includes('normal') ? 'bg-rose-600/10 border-rose-600/30 text-rose-500' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {result.overallAssessment.toLowerCase().includes('normal') ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />} {result.overallAssessment}
              </div>
            </div>
          )}
        </div>

        {/* Right: Analysis Results */}
        <div className="flex-1 bg-zinc-900/40 relative overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
           {!result && !scanning && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-32 h-32 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Scan className="w-16 h-16 text-blue-500/50" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">Awaiting Scan Feed</h2>
              <p className="text-sm font-medium text-zinc-500 mb-8 leading-relaxed max-w-md">Initialize the AI core by mounting a DICOM, JPEG, or structured image feed. The neural net will extract anomalies automatically.</p>
              <div className="grid grid-cols-2 gap-4 w-full text-left">
                {[{i:Eye,l:"Structural Vector"},{i:AlertTriangle,l:"Clinical Finding"},{i:Layers,l:"Deep Stratification"},{i:Activity,l:"Threat Level"}].map(f=><div key={f.l} className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl"><f.i className="w-6 h-6 text-zinc-600 mb-3" /><div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{f.l}</div></div>)}
              </div>
            </div>
          )}

          {scanning && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 mb-10">
                <div className="absolute inset-0 border-[4px] border-white/[0.05] rounded-full" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[4px] border-transparent border-t-blue-500 rounded-full" />
                <div className="absolute inset-4 bg-zinc-900 border border-white/[0.05] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                  <Scan className="w-12 h-12 text-blue-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Algorithm Engaged</h3>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] animate-pulse">Processing Image Matrices...</p>
            </div>
          )}

          {result && !scanning && (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-4 text-blue-400 text-[10px] font-black uppercase tracking-widest"><Stethoscope className="w-4 h-4" /> Core Synthesis</div>
                <p className="text-sm text-zinc-300 font-medium leading-relaxed">{result.primaryFindings}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-[2rem] overflow-hidden">
                <div className="flex border-b border-white/[0.05]">
                  {(['findings', 'differential', 'recommendations'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`}>
                      {tab === "findings" ? "Identified Points" : tab === "differential" ? "Deltas (DDx)" : "Action Items"}
                    </button>
                  ))}
                </div>
                
                <div className="p-6">
                  {activeTab === 'findings' && (
                    <div className="space-y-4">
                      {result.findings.map((f, i) => (
                        <div key={i} className={`p-5 rounded-2xl border ${SEVERITY_STYLES[f.severity]}`}>
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-black text-sm uppercase tracking-wide">{f.region}</span>
                            <span className="text-[9px] font-black bg-black/20 px-2 py-1 rounded border border-current/20 uppercase tracking-widest">{f.severity}</span>
                          </div>
                          <p className="text-xs font-medium mb-4 opacity-90 leading-relaxed">{f.observation}</p>
                          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-80">
                             Accuracy Confidence: {(f.confidence).toFixed(0)}%
                             <div className="flex-1 h-1 bg-black/20 rounded-full"><div className="h-full bg-current rounded-full transition-all duration-500" style={{ width: `${f.confidence}%`}}/></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'differential' && (
                    <div className="space-y-3">
                       {result.differentialDiagnosis.map((dx, i) => (
                         <div key={i} className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                           <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-black flex items-center justify-center border border-blue-500/30 flex-shrink-0">{i+1}</div>
                           <span className="text-sm font-bold text-white uppercase tracking-wide">{dx}</span>
                         </div>
                       ))}
                    </div>
                  )}
                  {activeTab === 'recommendations' && (
                    <div className="space-y-3">
                      {result.recommendations.map((r, i) => (
                         <div key={i} className="flex items-start gap-3 bg-red-600/10 border border-red-600/20 p-5 rounded-2xl">
                           <ShieldCheck className="w-5 h-5 text-red-500 font-black flex-shrink-0 mt-0.5" />
                           <span className="text-xs font-bold text-red-400 leading-relaxed uppercase tracking-wider">{r}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
