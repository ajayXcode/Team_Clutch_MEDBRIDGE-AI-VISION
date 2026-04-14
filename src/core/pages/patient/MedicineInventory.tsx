import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Search, ShoppingBag, Plus, Minus, 
  Tag, Info, CheckCircle2, ShoppingCart, Loader2,
  Trash2, Wallet, Award, ArrowUpRight, ChevronRight,
  Filter, Sparkles, HeartPulse
} from "lucide-react";
import { mockApi, InventoryMedicine } from "../../lib/mockData";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function MedicineInventory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<InventoryMedicine[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(0);

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => {
      setMedicines(mockApi.getMedicines());
      setRewardPoints(mockApi.getRewardPoints(user?.id || "demo"));
      setLoading(false);
    }, 800);
  }, [user]);

  const categories = ["all", ...new Set(medicines.map(m => m.category))];

  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.genericName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || m.category === filter;
    return matchesSearch && matchesFilter;
  });

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        const newQty = Math.max(0, existing.qty + delta);
        if (newQty === 0) return prev.filter(item => item.id !== id);
        return prev.map(item => item.id === id ? { ...item, qty: newQty } : item);
      }
      if (delta > 0) return [...prev, { id, qty: 1 }];
      return prev;
    });
  };

  const getCartQty = (id: string) => cart.find(i => i.id === id)?.qty || 0;
  const cartTotal = cart.reduce((sum, item) => {
    const med = medicines.find(m => m.id === item.id);
    return sum + (med ? med.price * item.qty : 0);
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    toast.success("Order request transmitted successfully", {
      description: "Verifying e-prescription link and authorizing dispatch.",
    });
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-600/30">
      {/* Decorative Blur */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10rem] left-[20%] w-[40rem] h-[40rem] bg-rose-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10rem] right-[10%] w-[30rem] h-[30rem] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/patient/dashboard")} className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-90">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-tight">Pharma Terminal</h1>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">Dispensing Secure Health Nodes</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Reward Points Badge */}
            <div className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-4 py-2 rounded-2xl shadow-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center">
                <Award className="w-4 h-4 text-black" />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-500 uppercase leading-none mb-1">Health Credits</div>
                <div className="text-xs font-black text-white">{rewardPoints.toLocaleString()} <span className="text-[9px] text-amber-500">PTS</span></div>
              </div>
            </div>
            
            <button className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl relative group transition-all hover:bg-white/10">
              <ShoppingBag className="w-5 h-5 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg shadow-rose-600/20 animate-in zoom-in">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-10 relative z-10">
        
        {/* Left: Filters & Rewards Mobile */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="sm:hidden flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] p-4 rounded-[2rem]">
            <Award className="w-6 h-6 text-amber-500" />
            <div>
              <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Available Credits</div>
              <div className="text-sm font-black text-white">{rewardPoints} PTS</div>
            </div>
            <button className="ml-auto p-2 bg-white/10 rounded-lg"><ChevronRight size={14} /></button>
          </div>

          <section className="bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/[0.05] space-y-6">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inventory Filters</span>
            </div>
            
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group
                    ${filter === cat 
                      ? "bg-white text-black shadow-lg shadow-white/5" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
                >
                  {cat}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${filter === cat ? "translate-x-1" : "opacity-0"}`} />
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/[0.05] space-y-4">
              <div className="p-4 bg-gradient-to-br from-rose-600/10 to-blue-600/10 rounded-2xl border border-white/[0.05]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Earn More Credits</span>
                </div>
                <ul className="space-y-2">
                  <li className="text-[9px] font-black text-zinc-300 flex items-center gap-2">• SCAN PRESCRIPTION <span className="text-amber-500">+50</span></li>
                  <li className="text-[9px] font-black text-zinc-300 flex items-center gap-2">• SYNC ABHA DATA <span className="text-amber-500">+100</span></li>
                  <li className="text-[9px] font-black text-zinc-300 flex items-center gap-2">• EMERGENCY SOS LOG <span className="text-amber-500">+200</span></li>
                </ul>
              </div>
            </div>
          </section>
        </aside>

        {/* Middle: Product Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-rose-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query Compound designator (eg: Dolo, Telma)..."
              className="w-full bg-zinc-900/60 border border-white/[0.08] px-16 py-5 rounded-[2rem] text-sm font-medium focus:outline-none focus:border-rose-600/50 transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-rose-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Scanning Satellite Inventory...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/40 rounded-[2.5rem] border border-dashed border-white/10">
                  <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <p className="text-xs font-black text-zinc-500 uppercase">No Clinical Matches Found</p>
                </div>
              ) : filtered.map((med, idx) => (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-zinc-950 border border-white/[0.05] hover:border-white/20 p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 transition-all hover:bg-zinc-900/60 shadow-xl"
                >
                  <div className="w-24 h-24 bg-white/[0.03] rounded-3xl flex items-center justify-center border border-white/[0.08] group-hover:bg-white/[0.05] transition-colors overflow-hidden">
                     <span className="text-4xl">💊</span>
                     <div className="absolute top-4 left-4">
                        <span className="px-2 py-1 bg-rose-600/10 text-rose-500 border border-rose-600/20 rounded-lg text-[8px] font-black uppercase tracking-widest">{med.category}</span>
                     </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-1 group-hover:text-rose-500 transition-colors">{med.name}</h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">{med.genericName}</p>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-md line-clamp-1">{med.description}</p>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                      <span className="text-lg font-black text-white">₹{med.price}</span>
                      <span className="text-[9px] font-black text-zinc-500 bg-white/5 px-2 py-1 rounded">STOCK: {med.stock} UNIT</span>
                      <div className="flex items-center gap-1.5 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                         <Award className="w-3.5 h-3.5" /> earn 15 credits
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateCart(med.id, -1)}
                      className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-base">{getCartQty(med.id)}</span>
                    <button 
                      onClick={() => updateCart(med.id, 1)}
                      className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 active:scale-90 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Cart Summary */}
        <aside className="lg:col-span-3">
          <div className="sticky top-32 space-y-6">
            <section className="bg-zinc-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/[0.05]">
                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Order Terminal
                </h3>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-none">
                  {cart.length === 0 ? (
                    <div className="py-10 text-center opacity-30">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Station Empty</p>
                    </div>
                  ) : cart.map(item => {
                    const med = medicines.find(m => m.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between group">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-white uppercase truncate">{med?.name}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase">{item.qty} UNIT × ₹{med?.price}</p>
                        </div>
                        <span className="text-xs font-black text-zinc-300">₹{(med?.price || 0) * item.qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <span>Subtotal Matrix</span>
                  <span className="text-white">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  <span>Credits applied</span>
                  <span>- ₹0</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-white tracking-widest">Final Net</span>
                  <span className="text-xl font-black text-white">₹{cartTotal}</span>
                </div>

                <div className="pt-2">
                  <p className="text-[8px] text-zinc-500 uppercase font-bold text-center leading-relaxed">
                    By confirming, you agree to our pharmaceutical data processing protocols.
                  </p>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-5 bg-rose-600 disabled:opacity-30 disabled:grayscale text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 active:scale-95 group"
                >
                  Confirm Payload <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </section>

            {/* Loyalty Card UI */}
            <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[2rem] border border-white/[0.1] p-6 shadow-2xl overflow-hidden group hover:scale-[1.02] transition-transform">
               <div className="absolute top-[-2rem] right-[-2rem] w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
               <div className="flex justify-between items-start mb-6">
                 <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-amber-500" />
                 </div>
                 <div className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] bg-black/40 px-3 py-1.5 rounded-full border border-white/5">MEDBRIDGE PRIVILEGE</div>
               </div>
               
               <div>
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Loyalty ID: MNB-{user?.id?.slice(0,6) || "DEMO99"}</div>
                 <h4 className="text-2xl font-black text-white tracking-tighter">{rewardPoints} <span className="text-sm text-amber-500 font-bold uppercase tracking-widest">Credits</span></h4>
               </div>
               
               <div className="mt-4 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} className="h-full bg-amber-500" />
                  </div>
                  <span className="text-[9px] font-black text-amber-500 uppercase">TIER GOLD</span>
               </div>
            </div>
          </div>
        </aside>

      </main>

      {/* Floating Action Button for Points (Mobile) */}
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="sm:hidden fixed bottom-6 left-6 right-6 z-40">
        <button onClick={() => toast.info("Your Reward History", { description: "You earned 150 points this week from health syncs." })}
          className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
          <Award className="w-5 h-5 text-amber-600" /> Track Health Credits
        </button>
      </motion.div>
    </div>
  );
}
