import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
// api replaced by mockApi
import { ArrowLeft, Heart, User, Shield, LogOut, Plus, Trash2, Loader2, Save, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getAge } from "../../lib/voice";

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, activePatient, updateActivePatient, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(activePatient || {});
  const [newTag, setNewTag] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const addTag = (field: string, val: string) => {
    if (!val.trim()) return;
    setForm((f: any) => ({ ...f, [field]: [...(f[field] || []), val.trim()] }));
    setNewTag(t => ({ ...t, [field]: "" }));
  };
  const removeTag = (field: string, item: string) => setForm((f: any) => ({ ...f, [field]: (f[field] || []).filter((i: string) => i !== item) }));

  const save = async () => {
    if (!activePatient) return;
    setLoading(true);
    try {
      const updated = await api.put<any>(`/patients/${activePatient.id}`, form);
      updateActivePatient(updated);
      setEditing(false);
      toast.success("Profile record encrypted and saved.");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const tagFields = [
    { key: "allergies", label: "Known Allergies", placeholder: "e.g. Penicillin" },
    { key: "medications", label: "Current Medications", placeholder: "e.g. Metformin 500mg" },
    { key: "conditions", label: "Medical Conditions", placeholder: "e.g. Type 2 Diabetes" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20 selection:bg-primary/30">
      <div className="bg-zinc-900/40 backdrop-blur-[40px] border-b border-white/[0.05] px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-lg">
        <button onClick={() => navigate("/patient/dashboard")} title="Back to Dashboard" className="p-2.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]"><Heart className="w-5 h-5 text-white" /></div>
        <h2 className="font-black text-lg uppercase tracking-tight">Identity Node</h2>
        <div className="ml-auto">
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => { setForm(activePatient); setEditing(false); }} className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">Abort</button>
              <button onClick={save} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Commit
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all">Edit Record</button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Profile Header */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="relative flex items-center gap-6 z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-4xl font-black uppercase">
              {user?.name?.[0] || "U"}
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">{user?.name}</h2>
              <p className="text-zinc-500 font-bold tracking-widest text-xs uppercase mb-3">{user?.email}</p>
              {activePatient?.dob && <div className="inline-flex gap-3 text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.05] px-4 py-1.5 rounded-lg border border-white/[0.05]">
                <span className="text-primary">{getAge(activePatient.dob)} YRS</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{activePatient.gender || "UNSPECIFIED"}</span>
              </div>}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white/[0.02] rounded-[2rem] border border-white/[0.05] p-8 shadow-xl">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-3">
            <User className="w-4 h-4 text-primary" /> Core Bio-Data
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Origin Date</label>
              {editing ? <input type="date" value={form.dob || ""} onChange={e => setForm((f: any) => ({ ...f, dob: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-all" aria-label="Date of Birth" />
                : <p className="text-lg font-bold text-white bg-white/[0.01] px-4 py-3 rounded-xl border border-white/[0.02]">{activePatient?.dob || "—"}</p>}
            </div>
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Classification</label>
              {editing ? <select value={form.gender || ""} onChange={e => setForm((f: any) => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-zinc-900 text-white focus:outline-none focus:border-primary/50 text-sm font-medium transition-all" aria-label="Gender Selection">
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select> : <p className="text-lg font-bold text-white bg-white/[0.01] px-4 py-3 rounded-xl border border-white/[0.02]">{activePatient?.gender || "—"}</p>}
            </div>
          </div>
        </div>

        {/* Health Tags */}
        <div className="grid gap-6">
          {tagFields.map(({ key, label, placeholder }) => (
            <div key={key} className="bg-white/[0.02] rounded-[2rem] border border-white/[0.05] p-8 shadow-xl">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5">{label}</h3>
              {editing && (
                <div className="flex gap-3 mb-5">
                  <input value={newTag[key] || ""} onChange={e => setNewTag(t => ({ ...t, [key]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag(key, newTag[key] || ""))}
                    placeholder={placeholder} className="flex-1 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-primary/50 text-sm font-medium placeholder:text-zinc-600 transition-all" aria-label={`New ${label}`} />
                  <button onClick={() => addTag(key, newTag[key] || "")} title={`Add ${label}`} className="px-5 py-3 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl hover:bg-white/10 transition-all"><Plus className="w-5 h-5" /></button>
                </div>
              )}
              <div className="flex flex-wrap gap-2.5">
                {(form[key] || []).length === 0 ? <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 border border-zinc-800 border-dashed px-4 py-2 rounded-lg">No entries logged</span> :
                  (form[key] || []).map((item: string) => (
                    <span key={item} className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-400 rounded-xl text-sm font-bold">
                      {item}{editing && <button onClick={() => removeTag(key, item)} title={`Remove ${item}`} className="ml-1 p-0.5 hover:bg-red-600/20 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-400" /></button>}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* ABHA */}
        <div className="bg-white/[0.02] rounded-[2rem] border border-white/[0.05] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-rose-600/5 rounded-full blur-[60px]" />
          <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
            <Shield className="w-4 h-4" /> National Health Matrix
          </h3>
          {activePatient?.abhaLinked ? (
            <div className="bg-rose-600/10 rounded-2xl p-6 border border-rose-600/20 relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">ABHA Node Active</p>
                <p className="text-lg font-mono text-rose-400 tracking-wider shadow-sm">{activePatient.abhaId}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-600/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-rose-500" />
              </div>
            </div>
          ) : (
            <button onClick={() => navigate("/profile/abha/create")} className="w-full flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/[0.08] hover:bg-rose-600/10 hover:border-rose-600/30 transition-all group relative z-10">
              <div className="text-left">
                <p className="font-black uppercase tracking-widest text-sm text-white group-hover:text-rose-500 transition-colors">Initialize ABHA Identification</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Connect to national database</p>
              </div>
              <ChevronRight className="w-6 h-6 text-zinc-500 group-hover:text-rose-500 transition-colors" />
            </button>
          )}
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); navigate("/"); }}
          className="w-full mt-10 py-5 border border-red-500/30 bg-red-500/5 text-red-500 hover:text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-3">
          <LogOut className="w-5 h-5" /> Execute Sign Out
        </button>
      </div>
    </div>
  );
}
