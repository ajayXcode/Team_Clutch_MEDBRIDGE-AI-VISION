import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  accountId: string;
  name: string;
  dob: string;
  gender: string;
  relationship: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  pastSurgeries: string[];
  abhaId: string;
  abhaLinked: boolean;
}

export interface AuthUser {
  token: string;
  accountId: string;
  patientId: string | null;
  doctorId: string | null;
  name: string;
  email: string;
  role: "patient" | "doctor";
}

interface AuthContextType {
  user: AuthUser | null;
  activePatient: Patient | null;
  allPatients: Patient[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  setActivePatient: (patient: Patient) => void;
  refreshPatients: () => Promise<void>;
  updateActivePatient: (updates: Partial<Patient>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Demo accounts (bypass email confirmation for hackathon) ──────────────────
const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  "doctor@medbridge.app": {
    token: "demo-doctor-token-arjun",
    accountId: "demo-doctor-001",
    patientId: null,
    doctorId: "demo-doctor-001",
    name: "Dr. Arjun Nair",
    email: "doctor@medbridge.app",
    role: "doctor",
  },
  "anita@medbridge.app": {
    token: "demo-doctor-token-anita",
    accountId: "demo-doctor-002",
    patientId: null,
    doctorId: "demo-doctor-002",
    name: "Dr. Anita Sharma",
    email: "anita@medbridge.app",
    role: "doctor",
  },
  "patient@medbridge.app": {
    token: "demo-patient-token-rahul",
    accountId: "demo-patient-001",
    patientId: "demo-patient-001",
    doctorId: null,
    name: "Rahul Sharma",
    email: "patient@medbridge.app",
    role: "patient",
  },
};

const DEMO_PASSWORDS: Record<string, string> = {
  "doctor@medbridge.app": "Doctor@123",
  "anita@medbridge.app": "Doctor@123",
  "patient@medbridge.app": "Patient@123",
};

// ─── Role detection from email ────────────────────────────────────────────────
function detectRole(email: string): "doctor" | "patient" {
  const doctorKeywords = ["doctor", "dr.", "doc", "physician", "clinic", "hospital", "anita", "arjun"];
  const lc = email.toLowerCase();
  return doctorKeywords.some(k => lc.includes(k)) ? "doctor" : "patient";
}

function buildUserFromSupabase(sbUser: any): AuthUser {
  const meta = sbUser.user_metadata || {};
  const role = meta.role || detectRole(sbUser.email || "");
  return {
    token: sbUser.access_token || sbUser.id,
    accountId: sbUser.id,
    patientId: role === "patient" ? sbUser.id : null,
    doctorId: role === "doctor" ? sbUser.id : null,
    name: meta.name || meta.full_name || sbUser.email?.split("@")[0] || "User",
    email: sbUser.email || "",
    role,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activePatient, setActivePatientState] = useState<Patient | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Build a default patient profile from auth user
  const buildDefaultPatient = useCallback((authUser: AuthUser): Patient => ({
    id: authUser.accountId,
    accountId: authUser.accountId,
    name: authUser.name,
    dob: "",
    gender: "",
    relationship: "Self",
    allergies: [],
    medications: [],
    conditions: [],
    pastSurgeries: [],
    abhaId: "",
    abhaLinked: false,
  }), []);

  // Try to load patients from DB, fall back to default profile
  const loadPatients = useCallback(async (authUser: AuthUser) => {
    if (authUser.role !== "patient") return;
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("account_id", authUser.accountId);

      if (!error && data && data.length > 0) {
        const mapped: Patient[] = data.map((p: any) => ({
          id: p.id,
          accountId: p.account_id,
          name: p.name || authUser.name,
          dob: p.dob || "",
          gender: p.gender || "",
          relationship: p.relationship || "Self",
          allergies: p.allergies || [],
          medications: p.medications || [],
          conditions: p.conditions || [],
          pastSurgeries: p.past_surgeries || [],
          abhaId: p.abha_id || "",
          abhaLinked: p.abha_linked || false,
        }));
        setAllPatients(mapped);
        setActivePatientState(mapped[0]);
      } else {
        // No DB record yet — use auth profile as default
        const defaultP = buildDefaultPatient(authUser);
        setAllPatients([defaultP]);
        setActivePatientState(defaultP);
      }
    } catch {
      const defaultP = buildDefaultPatient(authUser);
      setAllPatients([defaultP]);
      setActivePatientState(defaultP);
    }
  }, [buildDefaultPatient]);

  // ─── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // First try sessionStorage for speed
        const stored = sessionStorage.getItem("mb_session");
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
          await loadPatients(parsed);
          setLoading(false);
          return;
        }
        // Fall back to Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = buildUserFromSupabase({ ...session.user, access_token: session.access_token });
          setUser(authUser);
          sessionStorage.setItem("mb_session", JSON.stringify(authUser));
          await loadPatients(authUser);
        }
      } catch (e) {
        console.error("Session restore error:", e);
        sessionStorage.removeItem("mb_session");
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [loadPatients]);

  // ─── LOGIN via Supabase Direct Auth ────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPass = password.trim();

    // ✅ Demo account bypass (instant login for hackathon demo)
    if (DEMO_ACCOUNTS[normalizedEmail]) {
      if (DEMO_PASSWORDS[normalizedEmail] !== normalizedPass && DEMO_PASSWORDS[normalizedEmail] !== password) {
        throw new Error("Invalid password for demo account.");
      }
      const authUser = DEMO_ACCOUNTS[normalizedEmail];
      setUser(authUser);
      sessionStorage.setItem("mb_session", JSON.stringify(authUser));
      await loadPatients(authUser);
      return;
    }

    // 🔐 Real Supabase Auth for registered users
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      // Check if a locally-registered session exists with this email
      const stored = sessionStorage.getItem("mb_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser;
          if (parsed.email === normalizedEmail && parsed.token.startsWith("local-")) {
            setUser(parsed);
            await loadPatients(parsed);
            return;
          }
        } catch { /* ignore */ }
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error("Login failed — no user returned.");

    const authUser = buildUserFromSupabase({ ...data.user, access_token: data.session?.access_token });
    setUser(authUser);
    sessionStorage.setItem("mb_session", JSON.stringify(authUser));
    await loadPatients(authUser);
  };

  // ─── REGISTER — works even without email confirmation ──────────────────────
  const register = async (formData: { name: string; email: string; phone: string; password: string }) => {
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Build a local auth user immediately (for instant access)
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const localUser: AuthUser = {
      token: localId,
      accountId: localId,
      patientId: localId,
      doctorId: null,
      name: formData.name,
      email: normalizedEmail,
      role: "patient",
    };

    // Try Supabase in background — if it works, upgrade the token
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone, role: "patient" },
          emailRedirectTo: undefined,
        },
      });

      // If Supabase returned a real user with a session (email confirm disabled), use that
      if (!error && data.user && data.session?.access_token) {
        const sbUser = buildUserFromSupabase({
          ...data.user,
          access_token: data.session.access_token,
          user_metadata: { name: formData.name, role: "patient" },
        });
        setUser(sbUser);
        sessionStorage.setItem("mb_session", JSON.stringify(sbUser));
        const defaultP = buildDefaultPatient(sbUser);
        setAllPatients([defaultP]);
        setActivePatientState(defaultP);
        return;
      }
      // If email confirmation required or rate limited — fall through to local session
    } catch {
      // Supabase unavailable — fall through to local session
    }

    // ✅ Local session — works 100% offline, perfect for hackathon
    setUser(localUser);
    sessionStorage.setItem("mb_session", JSON.stringify(localUser));
    const defaultP = buildDefaultPatient(localUser);
    setAllPatients([defaultP]);
    setActivePatientState(defaultP);
  };

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setActivePatientState(null);
    setAllPatients([]);
    sessionStorage.removeItem("mb_session");
  };

  const setActivePatient = (patient: Patient) => setActivePatientState(patient);

  const refreshPatients = async () => {
    if (user) await loadPatients(user);
  };

  const updateActivePatient = (updates: Partial<Patient>) => {
    if (activePatient) {
      const updated = { ...activePatient, ...updates };
      setActivePatientState(updated);
      setAllPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const value = React.useMemo(() => ({
    user, activePatient, allPatients, loading,
    login, register, logout,
    setActivePatient, refreshPatients, updateActivePatient,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, activePatient, allPatients, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
