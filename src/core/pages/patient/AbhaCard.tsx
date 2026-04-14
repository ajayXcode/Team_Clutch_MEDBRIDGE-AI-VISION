import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { MOCK_PATIENT_PROFILE, MOCK_PRESCRIPTIONS } from "../../lib/mockData";
import {
  ArrowLeft, Download, Share2, FileText, ExternalLink,
  CheckCircle, Shield, QrCode, Heart, Calendar, User,
  Phone, MapPin, Droplets, AlertCircle, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ─── Mock health records ──────────────────────────────────────────────────────
const HEALTH_RECORDS = [
  { id: "r1", date: "2026-04-12", facility: "Apollo Clinic, Mumbai", type: "Prescription", description: "Paracetamol + Amoxyclav for Viral URTI — Dr. Priya Sharma", downloadUrl: "#" },
  { id: "r2", date: "2026-03-30", facility: "Fortis Hospital, Bengaluru", type: "Lab Report", description: "CBC + LFT + RFT — Annual health check panel", downloadUrl: "#" },
  { id: "r3", date: "2026-03-15", facility: "Max Healthcare, Delhi", type: "Discharge Summary", description: "Appendectomy — Laparoscopic, uneventful recovery", downloadUrl: "#" },
  { id: "r4", date: "2026-02-20", facility: "Ruby Hall Clinic, Pune", type: "Prescription", description: "Amlodipine 5mg OD for Hypertension — Dr. Fatima Shaikh", downloadUrl: "#" },
  { id: "r5", date: "2026-01-10", facility: "KIMS Hospital, Hyderabad", type: "Lab Report", description: "ECG + 2D Echo — Cardiac evaluation, normal sinus rhythm", downloadUrl: "#" },
];

const TYPE_COLORS: Record<string, string> = {
  "Prescription": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Lab Report": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Discharge Summary": "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

// ─── Modern QR Code (SVG art) ─────────────────────────────────────────────────
function QRCode({ value }: { value: string }) {
  // Deterministic pattern from value
  const bits = value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const grid = Array.from({ length: 21 }, (_, r) =>
    Array.from({ length: 21 }, (_, c) => {
      // Fixed corner markers
      if ((r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7)) return true;
      // Deterministic fill
      return ((r * 21 + c + bits) % 3) === 0;
    })
  );
  return (
    <svg viewBox="0 0 21 21" className="w-full h-full" shapeRendering="crispEdges">
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000" /> : null
        )
      )}
    </svg>
  );
}

export default function AbhaCard() {
  const navigate = useNavigate();
  const { activePatient, user } = useAuth();
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const profile = MOCK_PATIENT_PROFILE;
  const abhaId = activePatient?.abhaId || profile.abhaId;
  const name = activePatient?.name || user?.name || profile.name;
  const dob = activePatient?.dob || "1995-08-15";
  const gender = activePatient?.gender || "Male";
  const bloodGroup = "B+";

  const dobFormatted = dob
    ? new Date(dob).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "15/08/1995";

  const handleDownload = () => {
    toast.success("📥 ABHA Card downloaded as PDF");
  };

  const handleShare = () => {
    setShareOpen(true);
    toast.success("🔗 Share link copied to clipboard!");
    navigator.clipboard.writeText(`ABHA ID: ${abhaId} | Name: ${name}`).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-600/30 pb-20">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate("/patient/dashboard")} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">ABHA Identity Card</h2>
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-[0.2em]">Ayushman Bharat Digital Mission</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Verified</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ═══ REAL ABHA CARD ═══════════════════════════════════════════════ */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Card — matches the actual Government of India ABHA card design */}
          <div className="rounded-[1.5rem] overflow-hidden shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] border border-white/10">
            {/* Top strip — NHA green */}
            <div className="bg-gradient-to-r from-[#006747] to-[#008c5f] px-5 pt-4 pb-5 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-white/5" />

              {/* Top row: Logo + Ministry text */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div>
                  {/* Ashoka Chakra placeholder */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                      <span className="text-[#006747] font-black text-[10px]">🏛️</span>
                    </div>
                    <div>
                      <div className="text-white/80 text-[8px] font-bold leading-tight">Ministry of Health &amp; Family Welfare</div>
                      <div className="text-white/60 text-[7px] leading-tight">Government of India</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-black text-lg tracking-tighter leading-none">ABHA</div>
                  <div className="text-white/70 text-[7px] font-bold leading-tight">Ayushman Bharat<br />Health Account</div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/20 mb-4" />

              {/* Main card body */}
              <div className="flex items-start gap-4 relative z-10">
                {/* Photo placeholder */}
                <div className="w-16 h-20 bg-white/10 border-2 border-white/30 rounded-xl flex-shrink-0 flex flex-col items-center justify-center overflow-hidden shadow-lg">
                  <User className="w-8 h-8 text-white/50" />
                  <span className="text-white/40 text-[7px] mt-1 font-bold">PHOTO</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-[9px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Name</div>
                  <div className="text-white font-black text-base tracking-wide uppercase leading-tight mb-3 truncate">{name}</div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Date of Birth</div>
                      <div className="text-white text-[11px] font-black">{dobFormatted}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Gender</div>
                      <div className="text-white text-[11px] font-black uppercase">{gender}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Blood Group</div>
                      <div className="text-red-300 text-[11px] font-black">{bloodGroup}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Mobile</div>
                      <div className="text-white text-[10px] font-black">+91 93725 41301</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ABHA Number strip */}
            <div className="bg-[#004f37] px-5 py-3 flex items-center justify-between">
              <div>
                <div className="text-white/60 text-[7px] font-bold uppercase tracking-widest mb-0.5">ABHA Number</div>
                <div className="text-white font-black text-xl tracking-[0.15em] font-mono">{abhaId}</div>
              </div>
              {/* QR Code */}
              <div className="w-14 h-14 bg-white p-1 rounded-lg shadow-lg flex-shrink-0">
                <QRCode value={abhaId} />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-[#003d2b] px-5 py-2.5 flex items-center justify-between">
              <div className="text-white/50 text-[7px] font-bold uppercase tracking-widest">
                Issued by: National Health Authority • abdm.gov.in
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-[7px] font-black uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Action buttons ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }} onClick={handleDownload}
            className="flex items-center justify-center gap-2.5 py-4 bg-green-600/10 border border-green-600/20 rounded-2xl text-green-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-600/20 transition-all"
          >
            <Download className="w-4 h-4" /> Download Card
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }} onClick={handleShare}
            className="flex items-center justify-center gap-2.5 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
          >
            <Share2 className="w-4 h-4" /> Share ID
          </motion.button>
        </div>

        {/* ─── Quick info pills ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Droplets, label: "Blood Group", value: bloodGroup, color: "text-red-400" },
            { icon: AlertCircle, label: "Allergies", value: "Penicillin, Sulfa", color: "text-orange-400" },
            { icon: Heart, label: "Conditions", value: "Mild Hypertension", color: "text-rose-400" },
            { icon: Calendar, label: "Last Visit", value: "12 Apr 2026", color: "text-purple-400" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl p-4">
              <item.icon className={`w-4 h-4 ${item.color} mb-2`} />
              <div className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-0.5">{item.label}</div>
              <div className="text-white text-[11px] font-black">{item.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ─── Current Address ─────────────────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl p-4 flex gap-3">
          <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">Registered Address</div>
            <div className="text-zinc-300 text-xs font-medium">{profile.address}</div>
          </div>
        </div>

        {/* ─── Health Records ──────────────────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl overflow-hidden">
          <button
            onClick={() => setRecordsOpen(!recordsOpen)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-black uppercase tracking-wide">Health Locker</div>
                <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{HEALTH_RECORDS.length} Records Synced</div>
              </div>
            </div>
            <motion.div animate={{ rotate: recordsOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </motion.div>
          </button>

          <AnimatePresence>
            {recordsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.05]"
              >
                <div className="p-4 space-y-3">
                  {HEALTH_RECORDS.map((r) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/10 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${TYPE_COLORS[r.type] || "bg-white/5 border-white/10"}`}>
                        <FileText className="w-4 h-4 text-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${TYPE_COLORS[r.type]}`}>{r.type}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{r.description}</p>
                        <p className="text-[9px] font-bold text-zinc-500 mt-0.5">
                          {r.facility} · {new Date(r.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <button className="text-zinc-700 hover:text-blue-400 transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── ABDM Links ─────────────────────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-white/[0.07] rounded-2xl divide-y divide-white/[0.05]">
          {[
            { label: "Link New Health Facility", sub: "Connect hospitals & clinics to your ABHA", icon: "🏥" },
            { label: "Consent Manager", sub: "Control who accesses your health data", icon: "🔒" },
            { label: "Link OPD Records", sub: "Pull records from NHA health stack", icon: "📋" },
          ].map((item, i) => (
            <button key={i} onClick={() => toast.info(`${item.label} — coming soon`)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <div className="text-white text-[11px] font-black">{item.label}</div>
                <div className="text-zinc-500 text-[9px]">{item.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[9px] text-zinc-700 font-bold uppercase tracking-widest pb-4">
          🇮🇳 Powered by Ayushman Bharat Digital Mission · ABDM
        </p>
      </div>
    </div>
  );
}
