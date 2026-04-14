import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
// api replaced by mockApi
import { ArrowLeft, Plus, Trash2, Loader2, Save, Heart, User, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getAge } from "../../lib/voice";

export default function FamilyProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [newTag, setNewTag] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any>(`/patients/${patientId}`).then(p => { setPatient(p); setForm(p); }).catch(() => toast.error("Node unregistered"));
  }, [patientId]);

  const addTag = (field: string, val: string) => {
    if (!val.trim()) return;
    setForm((f: any) => ({ ...f, [field]: [...(f[field] || []), val.trim()] }));
    setNewTag(t => ({ ...t, [field]: "" }));
  };
  const removeTag = (field: string, item: string) => setForm((f: any) => ({ ...f, [field]: (f[field] || []).filter((i: string) => i !== item) }));

  const save = async () => {
    setLoading(true);
    try {
      const updated = await api.put<any>(`/patients/${patientId}`, form);
      setPatient(updated); setEditing(false);
      toast.success("Profile updated");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  if (!patient) return <div className="min-h-screen bg-black flex items-center justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  const tagFields = [
    { key: "allergies", label: "Identified Allergens", color: "red", icon: AlertTriangle },
    { key: "medications", label: "Active Compounds", color: "blue", icon: Activity },
    { key: "conditions", label: "Underlying Anomalies", color: "purple", icon: Heart },
    { key: "pastSurgeries", label: "Previous Interventions", color: "amber", icon: User },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[20rem] h-[20rem] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/patient/dashboard")} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)]"><Heart className="w-4 h-4 text-white" /></div>
        <h2 className="text-sm font-black uppercase tracking-widest text-white mt-0.5">Profile Matrix</h2>
        <div className="ml-auto">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setForm(patient); setEditing(false); }} className="px-4 py-2 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">Abort</button>
              <button onClick={save} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Commit
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-5 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/[0.1] transition-colors">Modify</button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-red-600/20 to-blue-600/20 border border-red-600/30 rounded-[2rem] p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-[30px] rounded-full transform group-hover:scale-150 transition-transform" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white/[0.05] border border-white/[0.1] rounded-2xl flex items-center justify-center text-3xl font-black uppercase shadow-xl">{patient.name?.[0]}</div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">{patient.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-red-400 bg-red-600/10 border border-red-600/20 px-2.5 py-1 rounded-md uppercase tracking-widest">{patient.relationship}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{patient.gender}</span>
                {patient.dob && <><span className="w-1 h-1 bg-zinc-600 rounded-full" /><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Uptime: {getAge(patient.dob)} Y</span></>}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/[0.05] p-6 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 mb-5 flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg"><User className="w-4 h-4 text-blue-400" /></div> Core Identity
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Creation Date</label>
              {editing ? <input type="date" value={form.dob || ""} onChange={e => setForm((f: any) => ({ ...f, dob: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors" />
                : <p className="text-sm font-black text-white px-4 py-3.5 bg-white/[0.02] border border-white/[0.02] rounded-xl">{patient.dob || "Unspecified"}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Classification</label>
              {editing ? <select value={form.gender || ""} onChange={e => setForm((f: any) => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-950 text-white focus:outline-none focus:border-red-600/50 text-sm font-medium transition-colors appearance-none">
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select> : <p className="text-sm font-black text-white px-4 py-3.5 bg-white/[0.02] border border-white/[0.02] rounded-xl">{patient.gender || "Unspecified"}</p>}
            </div>
          </div>
        </div>

        {/* Tag fields */}
        {tagFields.map(({ key, label, color, icon: Icon }) => (
          <div key={key} className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl border border-white/[0.05] p-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 mb-5 flex items-center gap-3">
               <div className={`p-1.5 bg-${color}-500/10 rounded-lg`}><Icon className={`w-4 h-4 text-${color}-400`} /></div> {label}
            </h3>
            {editing && (
              <div className="flex gap-3 mb-4">
                <input value={newTag[key] || ""} onChange={e => setNewTag(t => ({ ...t, [key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(key, newTag[key] || ""))}
                  placeholder={`Log new parameter...`} className="flex-1 px-4 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-950 text-white text-sm focus:outline-none focus:border-red-600/50 transition-colors placeholder:text-zinc-600" />
                <button onClick={() => addTag(key, newTag[key] || "")} className="px-5 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl hover:bg-white/[0.1] text-white transition-colors active:scale-95"><Plus className="w-5 h-5" /></button>
              </div>
            )}
            <div className="flex flex-wrap gap-2.5">
              {(form[key] || []).length === 0 ? <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-white/[0.02] px-4 py-2 rounded-lg border border-white/[0.02]">Null Vector</span> :
                (form[key] || []).map((item: string) => (
                  <span key={item} className={`flex items-center gap-2 px-3.5 py-2 bg-[rgba(var(--${color}-500),0.1)] text-${color}-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[rgba(var(--${color}-500),0.2)]`}>
                    {item}{editing && <button onClick={() => removeTag(key, item)} className="hover:bg-red-500/20 p-1 -mr-1 rounded text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </span>
                ))}
            </div>
          </div>
        ))}
        <div className="py-2" />
      </div>
    </div>
  );
}
