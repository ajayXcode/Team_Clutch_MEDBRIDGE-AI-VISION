import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, MapPin, Phone, Clock, Star, Navigation2,
  Building2, Search, Loader2, Heart, ExternalLink,
  ChevronRight, Ambulance, Activity, ShieldCheck
} from "lucide-react";
import { mockApi, Clinic } from "../../lib/mockData";
import { toast } from "sonner";

// ─── Direct Leaflet (No react-leaflet to avoid crashes) ───────────────────
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TYPE_BADGE: Record<string, string> = {
  "Multi-specialty": "bg-blue-600/10 text-blue-500 border-blue-600/20",
  "Government Pharmacy": "bg-green-600/10 text-green-500 border-green-600/20",
  "Hospital Emergency": "bg-red-600/10 text-red-500 border-red-600/20",
  "Primary Health Centre": "bg-amber-600/10 text-amber-500 border-amber-600/20",
};

export default function NearbyClinics() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [locating, setLocating] = useState(true);
  const [userCity, setUserCity] = useState("Mumbai, Maharashtra");
  const [selected, setSelected] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.0760, 72.8777]); 

  // Initialize Data
  useEffect(() => {
    setClinics(mockApi.getNearbyClinics());
    const timer = setTimeout(() => setLocating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Map directly via DOM
  useEffect(() => {
    if (!locating && mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(mapCenter, 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [locating]);

  // Update Markers when clinics change
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = clinics.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase());
      const matchesType = filter === "all" || c.type === filter;
      return matchesSearch && matchesType;
    });

    filtered.forEach(c => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${c.type === 'Hospital Emergency' ? '#ef4444' : '#f97316'}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12]
      });

      const m = L.marker([c.lat || 19.07, c.lng || 72.87], { icon })
        .addTo(leafletMap.current!)
        .on('click', () => {
          setSelected(c.id);
          leafletMap.current?.flyTo([c.lat || 19.07, c.lng || 72.87], 15);
        });
      markersRef.current.push(m);
    });
  }, [clinics, search, filter, locating]);

  const handleSelectClinic = (c: Clinic) => {
    setSelected(c.id);
    if (c.lat && c.lng && leafletMap.current) {
      leafletMap.current.flyTo([c.lat, c.lng], 15);
    }
  };

  const filtered = clinics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = filter === "all" || c.type === filter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-rose-600/30 relative flex flex-col">
      {/* Header */}
      <div className="bg-[#050505]/80 backdrop-blur-3xl border-b border-white/[0.08] px-4 py-3.5 flex items-center gap-3 sticky top-0 z-50 shrink-0">
        <button onClick={() => navigate("/patient/dashboard")} className="p-2.5 hover:bg-white/10 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white leading-none">Nearby Clinics</h2>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {locating ? "Locating Facilities..." : "GPS Connected"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
           <button onClick={() => toast.error("Dispatching rescue...")} className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 border border-rose-600/20 rounded-full text-rose-500 text-[10px] font-black uppercase">
             <Ambulance size={14} /> SOS
           </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid lg:grid-cols-12 gap-8 overflow-hidden">
        
        <div className="lg:col-span-8 h-full relative">
           {locating && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 z-40 rounded-[2.5rem] border border-white/10">
                <Loader2 className="w-10 h-10 animate-spin text-rose-600" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Scanning Terrain...</p>
              </div>
           )}
           <div ref={mapRef} className="h-full w-full bg-zinc-900 border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-2xl z-0" />
           
           {/* Floating Search */}
           <div className="absolute top-6 left-6 right-6 z-30">
              <div className="relative group/search">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within/search:text-rose-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Locate Apollo, Jan Aushadhi..."
                  className="w-full pl-14 pr-6 py-4 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl text-sm outline-none focus:border-rose-600/50"
                />
              </div>
           </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
           <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-none shrink-0">
              <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border shrink-0 ${filter === "all" ? "bg-rose-600 border-rose-600" : "bg-white/5 border-white/10"}`}>All Clinics</button>
              {Object.keys(TYPE_BADGE).map(t => (
                 <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border shrink-0 ${filter === t ? "bg-white text-black" : "bg-white/5 border-white/10"}`}>
                   {t.split(' ')[0]}
                 </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {filtered.map((clinic) => (
                 <div
                   key={clinic.id}
                   onClick={() => handleSelectClinic(clinic)}
                   className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer ${selected === clinic.id ? 'border-rose-600/50 bg-rose-600/5' : 'border-white/[0.08] bg-zinc-900/40 hover:border-white/20'}`}
                 >
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10"><Building2 size={20} className="text-rose-500" /></div>
                       <div className="flex-1">
                          <h3 className="text-xs font-black uppercase tracking-tight">{clinic.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-zinc-500 uppercase">
                             <span className="text-rose-500">{clinic.distance}</span>
                             <span>{clinic.rating} ★</span>
                          </div>
                          {selected === clinic.id && (
                             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                <p className="text-[10px] text-zinc-400">{clinic.address}</p>
                                <button onClick={() => navigate("/book/manual")} className="w-full py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase shadow-xl hover:bg-zinc-200">Book Appointment</button>
                             </motion.div>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
