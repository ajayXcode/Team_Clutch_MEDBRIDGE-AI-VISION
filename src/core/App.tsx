import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes";
import { OfflineBanner } from "./components/OfflineBanner";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import { supabase } from "./lib/supabase";

export default function App() {
  useEffect(() => {
    // Quick connection test
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('appointments').select('id', { count: 'estimated', head: true });
        if (error) throw error;
        console.log("🟢 Supabase Connected Successfully");
      } catch (err: any) {
        console.error("🔴 Supabase Connection Failed:", err.message);
        toast.error("Supabase connection error. Check your API keys.");
      }
    };
    testConnection();
  }, []);

  return (
    <AuthProvider>
      <OfflineBanner />
      <RouterProvider router={router} />
      <PwaInstallPrompt />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
