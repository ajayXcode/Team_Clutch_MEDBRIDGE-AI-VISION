import { motion } from "motion/react";
import { Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function PrivacyPolicy() {
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center mb-8">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-tight">
              Privacy <br /> <span className="text-red-500">Policy</span>
            </h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-12 border-b border-white/[0.05] pb-8">
              Digital Personal Data Protection (DPDP) Act, 2023 Compliant
            </p>

            <div className="space-y-12">
              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">01</span> Data Collection & Purpose
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                  <p>
                    <strong className="text-zinc-200">What we collect:</strong> We collect Personal Data (name, contact details) and Sensitive Health Data (prescriptions, symptoms inputted into the AI Triage Nurse, ABHA IDs, family profiles).
                  </p>
                  <p>
                    <strong className="text-zinc-200">Purpose:</strong> Data is strictly utilized for facilitating doctor-patient consultations, generating AI triage summaries, and linking health records via the Ayushman Bharat Digital Mission (ABDM) framework.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">02</span> Consent & ABHA Integration
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium">
                  <p>
                    <strong className="text-zinc-200">Explicit Consent:</strong> By utilizing MEDBRIDGE AI-Vision, you provide explicit, affirmative consent for the collection and processing of your health data. 
                  </p>
                  <p>
                    When creating or linking an ABHA ID, you consent to the fetching and sharing of health records across the Ayushman Bharat Digital Mission (ABDM) network as per the official Health Data Management Policy.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">03</span> Data Storage & Security
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium border-l-2 border-red-600/30 pl-6 bg-red-600/5 py-4 rounded-r-xl">
                  <p>
                    We implement industry-standard <span className="text-white">AES-256 encryption</span> to protect your data in transit and at rest. 
                  </p>
                  <p>
                    In full compliance with government data localization mandates, all health data is localized and stored on secure servers located exclusively within the territory of India.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-3">
                  <span className="text-red-500">04</span> User Rights
                </h2>
                <ul className="space-y-4 text-sm leading-relaxed text-zinc-400 font-medium list-none">
                  <li className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <p><strong className="text-zinc-200">Right to Access:</strong> Users may request a digital copy of all their stored data at any time.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <p><strong className="text-zinc-200">Right to Correction/Erasure:</strong> Users can update their clinical profiles or request permanent deletion of their account and associated records.</p>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    <p><strong className="text-zinc-200">Right to Nominate:</strong> Users can nominate a legal representative to manage their clinical data in the event of incapacity.</p>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
