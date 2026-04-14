import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
// api replaced by mockApi
import { motion } from "motion/react";
import {
  Download, Heart, CheckCircle, Loader2, FileText,
  Calendar, Clock, User, Stethoscope, Pill, ArrowLeft,
  Share2, AlertTriangle, Phone, Mic, Languages
} from "lucide-react";
import { toast } from "sonner";
import { VoiceAgent } from "../../lib/voice";

const agent = new VoiceAgent();

const LANGUAGES = [
  { code: "en-IN", name: "English", native: "English" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
  { code: "ta-IN", name: "Tamil", native: "தமிழ்" },
  { code: "te-IN", name: "Telugu", native: "తెలుగు" },
];

const EXPLAIN_PROMPTS: Record<string, any> = {
  "en-IN": {
    intro: "Hello, I am MEDBRIDGE AI-Vision, your digital health assistant. Let me explain your medication.",
    parts: { dosage: "The dosage is", freq: "You should take it", dur: "For a period of" }
  },
  "hi-IN": {
    intro: "नमस्ते, मैं आरोही हूँ, आपकी डिजिटल स्वास्थ्य सहायक। आइए मैं आपको आपकी दवा के बारे में समझाती हूँ।",
    parts: { dosage: "इसकी खुराक है", freq: "आपको इसे लेना चाहिए", dur: "इतనే समय के लिए:" }
  },
  "ta-IN": {
    intro: "வணக்கம், நான் ஆரோஹி, உங்கள் டிஜிட்டல் சுகாதார உதவியாளர். உங்கள் மருந்தைப் பற்றி நான் விளக்குகிறேன்.",
    parts: { dosage: "அளவு", freq: "நீங்கள் இதை எடுக்க வேண்டும்", dur: "கால அளவு:" }
  },
  "te-IN": {
    intro: "నమస్తే, నేను ఆరోహిని, మీ డిజిటల్ హెల్త్ అసిస్టెంట్‌ని. మీ ఔషధం గురించి వివరించనివ్వండి.",
    parts: { dosage: "మోతాదు", freq: "మీరు దీనిని తీసుకోవాలి", dur: "సమయం:" }
  }
};

interface PrescriptionData {
  id: string;
  patientName: string;
  patientAge: number;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  slot: string;
  diagnosis: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  instructions: string;
  followUp: string;
  clinicName?: string;
  clinicPhone?: string;
}

const DEMO_PRESCRIPTION: PrescriptionData = {
  id: "demo-rx",
  patientName: "Priya Sharma",
  patientAge: 34,
  doctorName: "Dr. Anita Sharma",
  doctorSpecialty: "General Physician",
  date: new Date().toISOString().split("T")[0],
  slot: "10:00",
  diagnosis: "Upper Respiratory Tract Infection with mild fever",
  medications: [
    { name: "Augmentin 625", dosage: "625mg", frequency: "Twice daily", duration: "7 days" },
    { name: "Dolo 650", dosage: "650mg", frequency: "Three times daily (SOS)", duration: "5 days" },
    { name: "Sinarest LP", dosage: "1 tablet", frequency: "At bedtime", duration: "5 days" },
  ],
  instructions: "Take all medicines after meals. Stay hydrated — drink 8-10 glasses of water daily. Rest adequately. Avoid cold beverages.",
  followUp: "Return after 7 days or earlier if fever persists beyond 3 days.",
  clinicName: "MEDBRIDGE AI-Vision Clinic",
  clinicPhone: "+91 98765 43210",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function PrescriptionDownload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [lang, setLang] = useState("hi-IN");
  const [speaking, setSpeaking] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<PrescriptionData>(`/prescriptions/${id}`);
        setPrescription(data);
      } catch {
        setPrescription(DEMO_PRESCRIPTION);
      } finally { setLoading(false); }
    };
    load();
    return () => { agent.stopSpeaking(); };
  }, [id]);

  const speakMedicine = (med: any) => {
    if (speaking) { agent.stopSpeaking(); setSpeaking(null); return; }
    
    setSpeaking(med.name);
    const p = EXPLAIN_PROMPTS[lang] || EXPLAIN_PROMPTS["en-IN"];
    const text = `${p.intro} ${med.name}. ${p.parts.dosage} ${med.dosage}. ${p.parts.freq} ${med.frequency}. ${p.parts.dur} ${med.duration}.`;
    
    agent.setLanguage(lang);
    agent.speak(text, () => setSpeaking(null));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow && prescription) {
        printWindow.document.write(`
          <html><head><title>Prescription – MEDBRIDGE AI-Vision</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #374151; font-size: 14px; }
            .value { color: #111827; font-size: 14px; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 13px; }
            td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            @media print { button { display: none; } }
          </style></head><body>
          <div class="header">
            <div><h1>MEDBRIDGE AI-Vision Prescription</h1>
              <p style="color:#6b7280;margin:0">Rx – ${prescription.id}</p></div>
            <div style="text-align:right">
              <strong>${prescription.clinicName || "MEDBRIDGE AI-Vision Clinic"}</strong>
              <p style="margin:0;color:#6b7280">${prescription.clinicPhone || ""}</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div><div class="label">Patient</div><div class="value">${prescription.patientName}, ${prescription.patientAge}y</div></div>
            <div><div class="label">Doctor</div><div class="value">${prescription.doctorName}<br><small>${prescription.doctorSpecialty}</small></div></div>
            <div><div class="label">Date</div><div class="value">${formatDate(prescription.date)}</div></div>
            <div><div class="label">Appointment</div><div class="value">${formatTime(prescription.slot)}</div></div>
          </div>
          <div class="section">
            <div class="label">Diagnosis</div>
            <div class="value" style="background:#f0f9ff;padding:10px;border-radius:8px;margin-top:6px">${prescription.diagnosis}</div>
          </div>
          <div class="section">
            <div class="label">Medications</div>
            <table><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
            ${prescription.medications.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.duration}</td></tr>`).join("")}
            </table>
          </div>
          ${prescription.instructions ? `<div class="section"><div class="label">Instructions</div><div class="value">${prescription.instructions}</div></div>` : ""}
          ${prescription.followUp ? `<div class="section"><div class="label">Follow-up</div><div class="value">${prescription.followUp}</div></div>` : ""}
          <div class="footer">Generated by MEDBRIDGE AI-Vision · AI-Powered Telemedicine Platform · This prescription is digitally verified.</div>
          <br><button onclick="window.print()">Print / Save as PDF</button>
          </body></html>
        `);
        printWindow.document.close();
        toast.success("Prescription opened for printing/saving");
      }
    } finally { setDownloading(false); }
  };

  const handleShare = async () => {
    if (!prescription) return;
    const text = `MEDBRIDGE AI-Vision Prescription for ${prescription.patientName}\nDate: ${formatDate(prescription.date)}\nDoctor: ${prescription.doctorName}\nDiagnosis: ${prescription.diagnosis}`;
    if (navigator.share) {
      await navigator.share({ title: "MEDBRIDGE AI-Vision Prescription", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Prescription details copied to clipboard");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-gray-500">Loading prescription…</p>
      </div>
    </div>
  );

  if (!prescription) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Prescription Not Found</h2>
        <p className="text-gray-500 mb-6">This prescription link may have expired or is invalid.</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">Go to MEDBRIDGE AI-Vision</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-50">
        <button onClick={() => navigate("/")} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={20} /></button>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center"><Heart className="w-4 h-4 text-white" /></div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-sm">Clinical Prescription</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rx {prescription.id.slice(-8).toUpperCase()}</p>
        </div>
        <button onClick={handleShare} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Share2 size={20} /></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Mic className="w-6 h-6 animate-pulse" /></div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">MEDBRIDGE AI-Vision Smart Explainer</h3>
              <p className="text-blue-100 text-xs">Tap any medicine to hear it explained in your language.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6 relative z-10">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} 
                className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${lang === l.code ? "bg-white text-blue-600 border-white" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}`}>
                {l.native}
              </button>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-blue-600">
           <div className="p-8 space-y-8">
             <div className="grid grid-cols-2 gap-6">
               <div className="bg-gray-50 rounded-2xl p-4">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Patient</span>
                 <p className="font-bold text-gray-900">{prescription.patientName}</p>
                 <p className="text-xs text-gray-500">{prescription.patientAge} Years</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-4 border-l-4 border-l-red-500">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Physician</span>
                 <p className="font-bold text-gray-900">{prescription.doctorName}</p>
                 <p className="text-xs text-gray-500">{prescription.doctorSpecialty}</p>
               </div>
             </div>

             <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">
               <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> {formatDate(prescription.date)}</span>
               <span className="flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {formatTime(prescription.slot)}</span>
             </div>

             <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3 text-blue-600"><FileText size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Clinical Diagnosis</span></div>
                <p className="text-blue-900 font-bold leading-relaxed">{prescription.diagnosis}</p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 ml-2"><Pill size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Medications & Schedule</span></div>
                <div className="space-y-3">
                  {prescription.medications.map((med, i) => (
                    <button key={i} onClick={() => speakMedicine(med)} className={`w-full text-left p-5 rounded-3xl border transition-all flex items-center gap-4 group relative overflow-hidden ${speaking === med.name ? "bg-blue-50 border-blue-200 shadow-md" : "bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50/50"}`}>
                      {speaking === med.name && <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${speaking === med.name ? "bg-blue-600 text-white animate-bounce" : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500"}`}>
                        {speaking === med.name ? <Mic size={24} /> : <Pill size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 uppercase tracking-tight">{med.name}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{med.dosage} · {med.frequency}</p>
                        <p className="text-[9px] text-blue-500 font-black mt-2 uppercase tracking-[0.2em]">{med.duration}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-[10px] group-hover:scale-110 transition-transform">Rx</div>
                    </button>
                  ))}
                </div>
             </div>
             
             {prescription.instructions && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
                   <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3">Physician Instructions</p>
                   <p className="text-amber-900 text-sm font-medium leading-relaxed italic">"{prescription.instructions}"</p>
                </div>
             )}
           </div>
           
           <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Digital Rx · MEDBRIDGE AI-Vision Unified Health Ecosystem</p>
           </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleDownload} disabled={downloading} className="py-5 bg-zinc-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">
            {downloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} Save Record
          </button>
          <button onClick={handleShare} className="py-5 bg-white text-zinc-900 border-2 border-gray-200 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
            <Share2 size={18} /> Share Digital
          </button>
        </div>
      </div>
    </div>
  );
}
