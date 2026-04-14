import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, ArrowRight, Stethoscope, FileText, Users, BarChart3, Heart } from "lucide-react";

export default function ConsultationComplete() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-teal-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
          <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-900/40">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Consultation Complete!</h1>
          <p className="text-slate-400 mb-8">Prescription has been saved and patient notified.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3 mb-8">
          {[
            { icon: FileText, text: "Prescription saved to patient record", color: "text-blue-400" },
            { icon: CheckCircle, text: "Appointment marked as Completed", color: "text-green-400" },
            { icon: Users, text: "Patient notified of consultation", color: "text-purple-400" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 text-left">
              <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
              <span className="text-slate-200 text-sm">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="space-y-3">
          <button onClick={() => navigate("/doctor/dashboard")}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-600 to-blue-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 shadow-lg">
            <Stethoscope className="w-5 h-5" /> Back to Dashboard <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
