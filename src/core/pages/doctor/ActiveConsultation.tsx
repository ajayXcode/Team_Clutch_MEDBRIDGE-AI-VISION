import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../lib/mockData";
import { getRiskBg, formatDate, formatTime } from "../../lib/voice";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Pen, Eraser, Square, Circle, Type, Trash2, Download,
  Heart, Brain, AlertTriangle, Upload, Loader2, Send, Plus, X,
  Activity, ChevronRight, Stethoscope, FileText, Camera, PenLine
} from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string; patientId: string; patientName: string; doctorId: string;
  date: string; slot: string; status: string; aiSummary: string | null;
  riskLevel: string | null; criticalFlags: string[]; checkedIn: boolean;
  patientAllergies?: string[]; patientMedications?: string[]; patientConditions?: string[];
}

interface ImagingResult {
  imageType: string; region: string; abnormalities: string[];
  qualityScore: number; confidence: number; findings: string; recommendations: string;
}

interface MedItem { name: string; dosage: string; frequency: string; duration: string; }

type Tool = "pen" | "eraser" | "rect" | "circle" | "text";

export default function ActiveConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#14b8a6"); // Default Teal matching the theme
  const [strokeSize, setStrokeSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [panel, setPanel] = useState<"summary" | "imaging" | "prescription">("summary");
  const [imagingResult, setImagingResult] = useState<ImagingResult | null>(null);
  const [imagingLoading, setImagingLoading] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [medications, setMedications] = useState<MedItem[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState({ heartRate: 72, temp: 37.0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== "doctor") { navigate("/doctor/login"); return; }
    const rawQueue = mockApi.getDoctorQueue(user.doctorId || "");
    const found = rawQueue.find(q => q.id === appointmentId);
    
    if (found) {
      setAppt({
        id: found.id,
        patientId: found.patientId,
        patientName: found.name,
        doctorId: user.doctorId || "",
        date: new Date().toISOString(),
        slot: found.slot,
        status: "Active",
        aiSummary: found.aiSummary,
        riskLevel: found.riskLevel,
        criticalFlags: found.symptoms,
        checkedIn: found.checkedIn
      });
      setVitals({ heartRate: found.riskScore > 70 ? 112 : 78, temp: found.riskScore > 50 ? 38.2 : 36.8 });
    }
    setLoading(false);
  }, [appointmentId, user, navigate]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = "#09090b"; // Pure Zinc-950 background for dark mode whiteboard
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setDrawing(true);
    setLastPos(pos);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = tool === "eraser" ? 20 : strokeSize;
    ctx.strokeStyle = tool === "eraser" ? "#09090b" : color;
    if (tool === "pen" || tool === "eraser") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    setLastPos(pos);
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    setDrawing(false);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (tool === "rect") {
      ctx.strokeStyle = color; ctx.lineWidth = strokeSize;
      ctx.strokeRect(lastPos.x, lastPos.y, pos.x - lastPos.x, pos.y - lastPos.y);
    } else if (tool === "circle") {
      ctx.strokeStyle = color; ctx.lineWidth = strokeSize;
      ctx.beginPath();
      const rx = (pos.x - lastPos.x) / 2, ry = (pos.y - lastPos.y) / 2;
      ctx.ellipse(lastPos.x + rx, lastPos.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) { ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard_scan_${appointmentId}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Telemetry exported!");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagingLoading(true);
    setPanel("imaging");
    // Simulate high-end Indian clinical AI analysis
    setTimeout(() => {
      const result: ImagingResult = {
        imageType: "Chest X-Ray (AP View)",
        region: "Thoracic Cavity",
        abnormalities: ["Increased bronchovascular markings", "Right lower lobe opacity"],
        qualityScore: 0.94,
        confidence: 0.89,
        findings: "The cardiac silhouette is within normal limits. There is no evidence of pneumothorax or pleural effusion. Findings suggestive of early-stage pneumonia or congestion.",
        recommendations: "Correlation with CBC and Sputum Culture advised. Repeat scan after 7 days of antibiotics."
      };
      setImagingResult(result);
      setImagingLoading(false);
    }, 2500);
  };

  const sendPrescription = async () => {
    if (!appt) return;
    const validMeds = medications.filter(m => m.name.trim());
    if (validMeds.length === 0) { toast.error("Parameters required"); return; }
    setSending(true);
    // Simulate e-prescription transmission to Jan Aushadhi / Patients
    setTimeout(() => {
      toast.success("✅ Prescription signed & transmitted to Pharmacy Control");
      navigate(`/doctor/dashboard`);
      setSending(false);
    }, 1500);
  };

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
  ];
  const colors = ["#14b8a6", "#ef4444", "#3b82f6", "#ffffff", "#f59e0b", "#8b5cf6"];

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" /><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Establishing Secure Link...</p></div>;

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-red-600/30">
      
      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-4 z-20 shrink-0">
        <button onClick={() => navigate("/doctor/dashboard")} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)] text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white leading-tight">Live Consultation Interface</h2>
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-[0.2em]">
            TARGET: {appt?.patientName} <span className="text-zinc-500">· {appt?.date ? formatDate(appt.date) : ""}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => window.open(`/consultation/${appointmentId}/whiteboard`, "_blank")}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/[0.1] active:scale-95"
          >
            <PenLine className="w-4 h-4 text-zinc-400" /> Undock Canvas
          </button>
          <button onClick={() => setShowPrescription(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 group">
            <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> Conclude & Transmit
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-96 bg-zinc-950/80 border-r border-white/[0.05] flex flex-col shrink-0">
          {/* Panel Tabs */}
          <div className="flex border-b border-white/[0.05]">
            {(["summary", "imaging"] as const).map(p => (
              <button key={p} onClick={() => setPanel(p)} 
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors 
                  ${panel === p ? "text-red-500 border-b-2 border-red-600 bg-red-600/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}`}>
                {p === "summary" ? "AI Telemetry" : "Scan Synthesis"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-white/10 p-5 space-y-4">
            {panel === "summary" && (
              <>
                {/* Risk Badge */}
                {appt?.riskLevel && (
                  <div className={`rounded-xl p-4 border bg-opacity-10 backdrop-blur-sm 
                    ${appt.riskLevel === 'HIGH' ? 'bg-red-500 border-red-500/30 text-red-400' 
                    : appt.riskLevel === 'MEDIUM' ? 'bg-amber-500 border-amber-500/30 text-amber-400' 
                    : 'bg-red-600 border-red-600/30 text-red-500'}`}>
                    <div className="flex items-center gap-3"><Activity className="w-5 h-5 flex-shrink-0" /><span className="text-xs font-black tracking-[0.2em] uppercase">Status: {appt.riskLevel}</span></div>
                  </div>
                )}
                
                {appt?.criticalFlags && appt.criticalFlags.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-3"><AlertTriangle className="w-4 h-4" />Critical Triggers</div>
                    {appt.criticalFlags.map(f => <div key={f} className="text-xs font-bold text-red-400">• {f}</div>)}
                  </div>
                )}

                {/* Real-time Patient Vitals (Simulation) */}
                <div className="mb-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-[30px] -mr-10 -mt-10 transition-transform group-hover:scale-125" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" /> Stream Active
                    </h3>
                    <div className="text-[9px] font-black text-red-500 bg-red-600/10 border border-red-600/20 px-2 py-1 rounded">SYNCED</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest"><Heart className="w-3 h-3 text-red-400" /> BPM</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tighter">{vitals.heartRate} <span className="text-sm text-zinc-600">bpm</span></span>
                      </div>
                      <input type="range" min="40" max="160" value={vitals.heartRate} onChange={(e) => setVitals(v => ({ ...v, heartRate: parseInt(e.target.value) }))} className="w-full h-8 bg-transparent appearance-none cursor-pointer accent-red-500" aria-label="Heart Rate Monitor" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest"><Activity className="w-3 h-3 text-blue-400" /> Temp</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tighter">{vitals.temp.toFixed(1)} <span className="text-sm text-zinc-600">°C</span></span>
                      </div>
                      <input type="range" min="35" max="41" step="0.1" value={vitals.temp} onChange={(e) => setVitals(v => ({ ...v, temp: parseFloat(e.target.value) }))} className="w-full h-8 bg-transparent appearance-none cursor-pointer accent-orange-500" aria-label="Body Temperature Monitor" />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-1 relative z-10 h-8 items-end">
                    {[...Array(24)].map((_, i) => (
                      <motion.div key={i} animate={{ height: [4, 16, 4, 24, 4] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.08 }} className="w-1 bg-red-600/40 rounded-t-sm" />
                    ))}
                  </div>
                </div>

                {appt?.aiSummary ? (
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-3"><Brain className="w-4 h-4" />Agent Synthesis</div>
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed">{appt.aiSummary}</p>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Target Node Offline</p>
                  </div>
                )}
                
                {/* Patient health */}
                <div className="flex flex-wrap gap-2">
                  {(appt?.patientAllergies || []).length === 0 && (appt?.patientMedications || []).length === 0 ? (
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No critical warnings logged</span>
                  ) : (
                    <>
                      {(appt?.patientAllergies || []).length > 0 && <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Multiple Allergies: {appt?.patientAllergies?.join(", ")}</span>}
                      {(appt?.patientMedications || []).length > 0 && <span className="px-3 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">Chronic Meds: {appt?.patientMedications?.join(", ")}</span>}
                    </>
                  )}
                </div>
              </>
            )}

            {panel === "imaging" && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-[2rem] p-8 text-center cursor-pointer hover:border-red-600 hover:bg-red-600/10 transition-all mb-4 bg-white/[0.01] group"
                >
                  <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-zinc-400 group-hover:text-red-500 transition-colors" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Target Image Upload</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-2">DCM, PNG, JPEG &lt; 4MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} title="Simulation Scan Target Selection" />
                </div>
                
                {imagingLoading && (
                  <div className="text-center py-10 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4 shadow-[0_0_15px_rgba(220,38,38,0.5)] rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Executing Deep Analysis</p>
                  </div>
                )}

                {imagingResult && !imagingLoading && (
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap mb-2">
                      <span className="px-3 py-1.5 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{imagingResult.imageType}</span>
                      <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[10px] font-black uppercase tracking-widest">{imagingResult.region}</span>
                      <span className="px-3 py-1.5 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest">CERTAINTY: {(imagingResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.05]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 border-b border-white/[0.05] pb-2">Primary Vectors</div>
                      <p className="text-xs font-medium text-zinc-300 leading-relaxed">{imagingResult.findings}</p>
                    </div>
                    {imagingResult.abnormalities?.length > 0 && (
                      <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20">
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 border-b border-amber-500/10 pb-2">Anomalies Detected</div>
                        {imagingResult.abnormalities.map(a => <div key={a} className="text-xs font-medium text-amber-300 mt-1">• {a}</div>)}
                      </div>
                    )}
                    <div className="bg-red-600/10 rounded-xl p-5 border border-red-600/20">
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 border-b border-red-600/10 pb-2">Protocol Suggestion</div>
                      <p className="text-xs font-medium text-red-400">{imagingResult.recommendations}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Whiteboard Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 right-4 bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] px-4 py-3 rounded-2xl flex items-center justify-between z-10 shadow-2xl">
            
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[0.05]">
              {tools.map(t => (
                <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                  className={`p-2.5 rounded-lg transition-all ${tool === t.id ? "bg-white/[0.1] text-white shadow-sm" : "text-zinc-500 hover:text-white"}`}>
                  <t.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/[0.05]">
              {colors.map(c => (
                <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool !== "eraser" ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-transparent opacity-60 hover:opacity-100"}`}
                  style={{ background: c }} />
              ))}
            </div>
            
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/[0.05]">
              <div className="w-2 h-2 rounded-full bg-zinc-600" />
              <input type="range" min="1" max="15" value={strokeSize} onChange={e => setStrokeSize(+e.target.value)} className="w-24 accent-red-600" aria-label="Stroke Size" title="Adjust Stroke Size" />
              <div className="w-4 h-4 rounded-full bg-zinc-600" />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={clearCanvas} className="flex items-center justify-center p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20" title="Clear">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={exportCanvas} title="Save to Local Storage" className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-600/10 hover:bg-red-600/20 rounded-xl transition-colors border border-red-600/20">
                <Download className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 w-full h-full">
            <canvas ref={canvasRef} className={`w-full h-full block ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
            
            {!drawing && !appt?.aiSummary && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
                <div className="text-center">
                  <div className="w-24 h-24 border-2 border-dashed border-white/40 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                     <Pen className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl font-black uppercase tracking-widest text-white mb-2">Clinical Canvas</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Standby for input</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Modal Container */}
      <AnimatePresence>
        {showPrescription && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-white/[0.08] rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-thin scrollbar-thumb-white/10">
              
              <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-xl border-b border-white/[0.05] px-6 py-5 flex items-center justify-between z-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <div className="p-2 bg-red-600/20 rounded-lg"><FileText className="w-4 h-4 text-red-500" /></div> Log Prescription
                </h3>
                <button onClick={() => setShowPrescription(false)} className="p-2 hover:bg-white/10 bg-white/[0.03] border border-white/[0.05] rounded-xl text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Target Node</label>
                  <div className="px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl text-xs font-black uppercase tracking-widest text-zinc-300">{appt?.patientName}</div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Diagnosis Vector</label>
                  <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Establish parameters..."
                    className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pharmacological Payload</label>
                    <button onClick={() => setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }])}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-600/10 px-3 py-1.5 rounded-lg hover:bg-red-600/20 transition-colors"><Plus className="w-3 h-3" />Append</button>
                  </div>

                  {medications.map((med, idx) => (
                    <div key={idx} className="bg-zinc-950 rounded-xl p-4 mb-4 border border-white/[0.05] relative group">
                      <div className="flex gap-3 mb-3">
                        <input value={med.name} onChange={e => setMedications(m => m.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                          placeholder="Compound Designator" className="flex-1 px-4 py-3 rounded-xl border border-white/[0.05] bg-zinc-900 text-white text-xs font-bold uppercase focus:outline-none focus:border-red-600/50 transition-colors" />
                        {medications.length > 1 && <button onClick={() => setMedications(m => m.filter((_, i) => i !== idx))} className="text-red-500 bg-red-500/10 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {["dosage", "frequency", "duration"].map(f => (
                          <div key={f} className="relative">
                            <input value={(med as any)[f]} onChange={e => setMedications(m => m.map((x, i) => i === idx ? { ...x, [f]: e.target.value } : x))}
                              placeholder={f.charAt(0).toUpperCase() + f.slice(1)} className="w-full px-3 py-3 pl-8 rounded-xl border border-white/[0.05] bg-zinc-900 text-white text-xs font-medium focus:outline-none focus:border-red-600/50 transition-colors placeholder:text-zinc-600" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-600 tracking-widest">{f.charAt(0).toUpperCase()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Protocol Directives</label>
                  <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Additional parameters..." rows={3}
                    className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Required Re-sync Date</label>
                  <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
                </div>

                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> Payload execution is irreversible. Verify parameters before transmission.
                </div>

                <button onClick={sendPrescription} disabled={sending}
                  className="w-full py-5 bg-red-600 text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 group">
                  {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Authorizing...</> : <><Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Sign & Transmit</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
