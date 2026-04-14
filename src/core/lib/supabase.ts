import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// ─── Supabase client ──────────────────────────────────────────────────────────
// Single singleton used throughout the frontend for:
//   • Direct DB queries (select, insert, update, delete)
//   • Realtime subscriptions
//   • Supabase Auth (if needed alongside existing session system)
//   • Storage (medical images, prescription PDFs, etc.)

const SUPABASE_URL = `https://${projectId}.supabase.co`;

export const supabase = createClient(SUPABASE_URL, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "mb_supabase_session",
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ─── Typed table helpers ──────────────────────────────────────────────────────
// Convenience wrappers for common tables so you don't need to remember schema names

export const db = {
  appointments: () => supabase.from("appointments"),
  patients: ()     => supabase.from("patients"),
  doctors: ()      => supabase.from("doctors"),
  accounts: ()     => supabase.from("accounts"),
  prescriptions: ()=> supabase.from("prescriptions"),
  imagingResults: ()=> supabase.from("imaging_results"),
  abhaRecords: ()  => supabase.from("abha_records"),
};

// ─── Storage helpers ──────────────────────────────────────────────────────────
export const storage = {
  // Upload a medical image file → returns its public URL
  uploadImage: async (bucket: string, path: string, file: File | Blob) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: "image/jpeg" });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  // Get public URL for an existing file
  getUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete a file from storage
  remove: async (bucket: string, paths: string[]) => {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
};

// ─── Realtime helpers ─────────────────────────────────────────────────────────
export const realtime = {
  // Subscribe to live changes on the appointments table for a specific doctor
  watchDoctorQueue: (doctorId: string, onUpdate: () => void) => {
    return supabase
      .channel(`doctor_queue_${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",    // INSERT, UPDATE, DELETE
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        onUpdate
      )
      .subscribe();
  },

  // Subscribe to live updates on a specific appointment
  watchAppointment: (appointmentId: string, onUpdate: (payload: any) => void) => {
    return supabase
      .channel(`appointment_${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointmentId}`,
        },
        onUpdate
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsub: (channel: ReturnType<typeof supabase.channel>) => {
    supabase.removeChannel(channel);
  },
};

export default supabase;
