import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff, Wifi, X } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline && !dismissed) && (
        <motion.div key="offline"
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            You're offline. Some features are unavailable. Voice check-in requires internet.
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      {showRestored && (
        <motion.div key="restored"
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white px-4 py-2.5 flex items-center gap-2 shadow-lg">
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Connection restored! You're back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
