import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
// api replaced by mockApi
import { ArrowLeft, Plus, Trash2, Loader2, Users, Heart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function FamilyAdd() {
  const navigate = useNavigate();
  const { user, refreshPatients } = useAuth();
  const [form, setForm] = useState({ name: "", relationship: "Spouse", dob: "", gender: "" });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [loading, setLoading] = useState(false);

  const addTag = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
    if (val.trim() && !list.includes(val.trim())) { setList([...list, val.trim()]); setVal(""); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user?.accountId) { toast.error("Designator is required"); return; }
    setLoading(true);
    try {
      await api.post("/patients", { accountId: user.accountId, ...form, allergies, conditions, medications: [], pastSurgeries: [] });
      await refreshPatients();
      toast.success(`Node ${form.name} initiated!`);
      navigate("/patient/dashboard");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10rem] left-[-10rem] w-[30rem] h-[30rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/patient/dashboard")} title="Back to Dashboard" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-300" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-purple-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)]"><Users className="w-4 h-4 text-white" /></div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Initialize Node</h2>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/[0.08] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">New Dependent</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">Add entity to health cluster</p>
            </div>
          </div>
          
          <form onSubmit={save} className="space-y-6">
            <div>
              <label htmlFor="designator-name" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Designator (Full Name) *</label>
              <input id="designator-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter designation" aria-label="Designator (Full Name)"
                className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-bold placeholder:font-medium placeholder:text-zinc-600 transition-colors uppercase tracking-wide" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="hierarchy-status" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Hierarchy Status</label>
                <select id="hierarchy-status" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} aria-label="Hierarchy Status"
                  className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors appearance-none">
                  {["Spouse", "Child", "Parent", "Sibling", "Other"].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="classification" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Classification</label>
                <select id="classification" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} aria-label="Classification"
                  className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors appearance-none">
                  <option value="">SELECT</option><option value="Male">MALE</option><option value="Female">FEMALE</option><option value="Other">OTHER</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="creation-date" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1 mb-2">Creation Date</label>
              <input id="creation-date" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} aria-label="Creation Date"
                className="w-full px-5 py-4 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
            </div>
            
            {[
              { label: "Identified Allergens", list: allergies, setList: setAllergies, val: newAllergy, setVal: setNewAllergy, placeholder: "e.g. PENICILLIN", color: "red", ariaLabel: "New Allergy" },
              { label: "Underlying Anomalies", list: conditions, setList: setConditions, val: newCondition, setVal: setNewCondition, placeholder: "e.g. TYPE-2 DIABETES", color: "purple", ariaLabel: "New Condition" },
            ].map(({ label, list, setList, val, setVal, placeholder, color, ariaLabel }) => (
              <div key={label} className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{label}</label>
                <div className="flex gap-3 mb-3">
                  <input value={val} onChange={e => setVal(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(list, setList, val, setVal))} placeholder={placeholder} aria-label={ariaLabel}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] bg-zinc-950 text-white text-sm font-bold focus:outline-none focus:border-red-600/50 transition-colors placeholder:font-medium placeholder:text-zinc-600 uppercase" />
                  <button type="button" onClick={() => addTag(list, setList, val, setVal)} title={`Add ${label.includes('Allergens') ? 'Allergy' : 'Condition'}`} className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl hover:bg-white/[0.1] text-white transition-colors active:scale-95"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {list.length === 0 && <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 pb-1">Null Vector</span>}
                  {list.map(item => (
                    <span key={item} className={`flex items-center gap-2 px-3 py-1.5 bg-${color}-500/10 text-${color}-300 border border-${color}-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                      {item}<button type="button" onClick={() => setList(list.filter(i => i !== item))} title={`Remove ${item}`} className="hover:text-red-400 transition-colors ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => navigate("/patient/dashboard")} className="flex-1 py-4 border border-white/[0.1] bg-white/[0.02] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-colors">Abort</button>
              <button type="submit" disabled={loading || !form.name.trim()} className="flex-[1.5] py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] group active:scale-95">
                {loading ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Plus className="w-4 h-4 group-hover:scale-125 transition-transform flex-shrink-0" />} Initialize Node
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
