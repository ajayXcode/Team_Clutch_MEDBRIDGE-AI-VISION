import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
// api replaced by mockApi
import { Heart, ArrowRight, Plus, Trash2, Loader2, CheckCircle, Users, UserCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "profile" | "family";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, activePatient, updateActivePatient } = useAuth();
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(false);

  // Profile step
  const [profile, setProfile] = useState({ dob: "", gender: "" });
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [newMed, setNewMed] = useState("");
  const [newCondition, setNewCondition] = useState("");

  // Family step
  const [members, setMembers] = useState<any[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relationship: "Spouse", dob: "", gender: "" });

  const saveProfile = async (skip = false) => {
    if (!skip && !activePatient) return;
    setLoading(true);
    try {
      if (!skip && activePatient) {
        await api.put(`/patients/${activePatient.id}`, { dob: profile.dob, gender: profile.gender, allergies, medications, conditions });
        updateActivePatient({ dob: profile.dob, gender: profile.gender, allergies, medications, conditions });
      }
      setStep("family");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const addTag = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim() && !list.includes(value.trim())) { setList([...list, value.trim()]); setValue(""); }
  };

  const addFamilyMember = async () => {
    if (!newMember.name.trim() || !user?.accountId) return;
    setLoading(true);
    try {
      const patient = await api.post("/patients", { accountId: user.accountId, name: newMember.name, relationship: newMember.relationship, dob: newMember.dob, gender: newMember.gender });
      setMembers([...members, patient]);
      setNewMember({ name: "", relationship: "Spouse", dob: "", gender: "" });
      setAddingMember(false);
      toast.success(`${newMember.name} added!`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const finishOnboarding = () => {
    toast.success("Profile setup complete!");
    navigate("/patient/dashboard");
  };

  if (step === "profile") return (
    <div className="min-h-screen bg-black text-white p-4 flex items-start justify-center py-12 relative overflow-hidden selection:bg-primary/30">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl uppercase tracking-widest text-white">MEDBRIDGE AI-Vision</span>
          <div className="ml-auto text-[10px] uppercase font-black tracking-widest text-zinc-500 px-3 py-1 border border-zinc-800 rounded-lg">Phase 1 / 2</div>
        </div>
        
        <div className="bg-zinc-900/60 backdrop-blur-[40px] rounded-[2rem] shadow-2xl border border-white/[0.08] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Patient Matrix</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Initialize clinical telemetry</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Origin Date</label>
                <input type="date" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Classification</label>
                <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-colors appearance-none">
                  <option value="">Select</option>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Tag inputs */}
            {[
              { label: "Known Allergies", list: allergies, setList: setAllergies, val: newAllergy, setVal: setNewAllergy, placeholder: "e.g. Penicillin, Pollen", color: "red" },
              { label: "Current Medications", list: medications, setList: setMedications, val: newMed, setVal: setNewMed, placeholder: "e.g. Metformin 500mg", color: "blue" },
              { label: "Existing Conditions", list: conditions, setList: setConditions, val: newCondition, setVal: setNewCondition, placeholder: "e.g. Type 2 Diabetes", color: "purple" },
            ].map(({ label, list, setList, val, setVal, placeholder, color }) => (
              <div key={label} className="space-y-2 bg-white/[0.02] border border-white/[0.02] p-5 rounded-2xl">
                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">{label}</label>
                <div className="flex gap-3 mb-3">
                  <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(list, setList, val, setVal))} placeholder={placeholder} className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm font-medium focus:outline-none focus:border-primary/50 placeholder:text-zinc-600 transition-colors" />
                  <button onClick={() => addTag(list, setList, val, setVal)} className="px-5 py-3 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl hover:bg-white/10 transition-colors active:scale-95"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.length === 0 ? <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-1">No entries logged</span> : list.map(item => (
                    <span key={item} className={`flex items-center gap-2 px-3 py-1.5 bg-[rgba(var(--${color}-500),0.1)] text-${color}-400 rounded-lg text-xs font-bold border border-[rgba(var(--${color}-500),0.2)]`}>
                      {item} <button onClick={() => setList(list.filter(i => i !== item))} className="hover:bg-white/10 p-0.5 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={() => saveProfile(true)} className="w-1/3 py-4 border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 hover:text-white transition-colors">
              Skip Phase
            </button>
            <button onClick={() => saveProfile(false)} disabled={loading} className="w-2/3 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Commit & Proceed <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Family step
  return (
    <div className="min-h-screen bg-black text-white p-4 flex items-start justify-center py-12 relative overflow-hidden selection:bg-red-600/30">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl uppercase tracking-widest text-white">MEDBRIDGE AI-Vision</span>
          <div className="ml-auto text-[10px] uppercase font-black tracking-widest text-zinc-500 px-3 py-1 border border-zinc-800 rounded-lg">Phase 2 / 2</div>
        </div>
        
        <div className="bg-zinc-900/60 backdrop-blur-[40px] rounded-[2rem] shadow-2xl border border-white/[0.08] p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
              <Users className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Network Topology</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Link authorized dependents</p>
            </div>
          </div>

          {/* Added members */}
          {members.length > 0 && <div className="space-y-3 mb-6">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-4 bg-rose-600/10 rounded-2xl border border-rose-600/20">
                <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="font-black tracking-wide text-rose-400 uppercase">{m.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{m.relationship}</p>
                </div>
              </div>
            ))}
          </div>}

          {/* Add member form */}
          {addingMember ? (
            <div className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-6 space-y-5 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-500">Initialize New Node</h3>
              
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Legal Name</label>
                <input value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} placeholder="Full name" 
                  className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Network Role</label>
                  <select value={newMember.relationship} onChange={e => setNewMember(m => ({ ...m, relationship: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium appearance-none transition-colors">
                    {["Spouse", "Child", "Parent", "Sibling", "Other"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Classification</label>
                  <select value={newMember.gender} onChange={e => setNewMember(m => ({ ...m, gender: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium appearance-none transition-colors">
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Origin Date</label>
                <input type="date" value={newMember.dob} onChange={e => setNewMember(m => ({ ...m, dob: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
              </div>
              
              <div className="flex gap-4 pt-2">
                <button onClick={() => setAddingMember(false)} className="w-1/3 py-3.5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">Abort</button>
                <button onClick={addFamilyMember} disabled={loading || !newMember.name.trim()} className="w-2/3 py-3.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Authorize Member
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingMember(true)} className="w-full py-5 border border-dashed border-white/20 rounded-2xl text-zinc-400 hover:border-red-600 hover:bg-red-600/10 hover:text-red-500 transition-colors flex items-center justify-center gap-3 mb-6 bg-white/[0.01]">
              <Plus className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Link New Node</span>
            </button>
          )}

          <div className="flex gap-4 mt-8">
            <button onClick={finishOnboarding} className="w-1/3 py-4 border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 hover:text-white transition-colors">
              Skip Phase
            </button>
            <button onClick={finishOnboarding} className="w-2/3 flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-red-500 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              Deploy Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
