import { motion } from "motion/react";
import { Scale, ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-red-600/30">
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Landing
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Legal Protocol // v1.0</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#09090b] border border-white/[0.05] rounded-[2.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -ml-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center mb-8">
              <Scale className="w-6 h-6 text-red-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
              Terms & <br /> <span className="text-red-500">Conditions</span>
            </h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-12 border-b border-white/[0.05] pb-8">
              Telemedicine Practice Guidelines, 2020 (India) Compliant
            </p>

            <div className="space-y-12">
              <section className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl">
                <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" /> Emergency Usage Warning
                </h2>
                <p className="text-sm leading-relaxed text-amber-500/90 font-bold uppercase tracking-wider">
                  MEDBRIDGE AI-Vision is NOT for medical emergencies. The AI Triage Nurse and Booking systems are for elective and non-emergency consultations only. In case of severe trauma or life-threatening symptoms, immediately visit the nearest physical hospital or call emergency services (108).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">01</span> Platform Role
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                  <p>
                    MEDBRIDGE AI-Vision operates strictly as a technology intermediary platform connecting independent Registered Medical Practitioners (RMPs) with patients. 
                  </p>
                  <p>
                    We are not a hospital, pharmacy, or healthcare provider. MEDBRIDGE AI-Vision is not liable for the clinical advice, diagnosis, or treatment plans provided by doctors during consultations.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">02</span> Telemedicine Guidelines
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                  <p>
                    All consultations facilitated through MEDBRIDGE AI-Vision comply with the <span className="text-white">Telemedicine Practice Guidelines (2020)</span> issued by the MoHFW, India. 
                  </p>
                  <p>
                    RMPs hold the full right to refuse a telemedicine consultation and recommend an in-person clinical visit if the patient's condition demands a physical examination.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">03</span> AI & ML Limitations
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium border-l-2 border-red-600/30 pl-6 bg-red-600/5 py-4 rounded-r-xl">
                  <p>
                    The <span className="text-white">AI Triage Nurse</span> and <span className="text-white">ML Risk Scoring</span> features are designed to assist clinicians by structuring symptomatic data. They do not formulate clinical diagnoses.
                  </p>
                  <p>
                    Prioritization based on 'Risk Scoring' is automated; it assists with efficiency but does not guarantee immediate medical intervention.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">04</span> Law & Jurisdiction
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of <span className="text-white">India</span>. 
                  </p>
                  <p>
                    Any disputes arising from the use of MEDBRIDGE AI-Vision shall be subject to the exclusive jurisdiction of the courts located in <span className="text-white">Mumbai, Maharashtra</span>.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
