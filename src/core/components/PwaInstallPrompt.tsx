import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Heart } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Only show on dashboard pages after 30 seconds
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s delay as per APP_FLOW spec
      setTimeout(() => {
        const dismissed = sessionStorage.getItem("pwa_dismissed");
        if (!dismissed) setShowPrompt(true);
      }, 30000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_dismissed", "1");
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
          <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/[0.08] p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600/20 to-red-600/20 border border-red-600/30 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-[11px] uppercase tracking-widest">Install MEDBRIDGE AI-Vision</p>
              <p className="text-[9px] font-medium text-zinc-400 mt-1 uppercase tracking-widest leading-relaxed">Mount application to local system.<br/>Enables offline + voice telemetry.</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={install} disabled={installing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(220,38,38,0.1)]">
                <Download className="w-3 h-3" /> Mount
              </button>
              <button onClick={dismiss} className="flex items-center justify-center gap-1.5 px-4 py-2 text-zinc-500 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors">
                 Abort
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
