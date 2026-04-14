import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use('*', logger(console.log));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, PATCH, DELETE",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
  "Access-Control-Max-Age": "600",
};
app.use("*", cors({
  origin: "*",
  allowHeaders: ["authorization", "x-client-info", "apikey", "content-type", "x-session-token"],
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "PATCH", "DELETE"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Explicitly handle OPTIONS for complex preflights
app.options("*", (c) => {
  return c.text("", 204, corsHeaders);
});

const USER_KEY = "AIzaSyCI4qwxn2H58d3su7tbZnae-3E86Uplrkc";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || USER_KEY;
const PREFIX = "/make-server-65d73ded";

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ─── Risk Engine (ML-style scoring) ───────────────────────────────────────────
function computeRisk(severity: number, duration: number, criticalFlag: boolean, age: number, symptomCount: number): { score: number; level: string } {
  if (criticalFlag) return { score: 0.95, level: "HIGH" };
  let score = 0;
  score += (severity / 10) * 0.4;
  score += Math.min(duration / 14, 1) * 0.2;
  score += (age > 60 ? 0.15 : age > 40 ? 0.08 : 0.02);
  score += Math.min(symptomCount / 5, 1) * 0.1;
  score = Math.min(score + Math.random() * 0.05, 1);
  const level = score > 0.66 ? "HIGH" : score > 0.33 ? "MEDIUM" : "LOW";
  return { score: Math.round(score * 100) / 100, level };
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok", ts: now() }));

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/auth/register`, async (c) => {
  try {
    const { name, email, phone, password } = await c.req.json();
    if (!name || !email || !password) return c.json({ error: "Missing required fields" }, 400);

    // Check duplicate email
    const existingAccounts = await kv.getByPrefix("account:");
    const existing = existingAccounts.find((a: any) => a.email === email.toLowerCase());
    if (existing) return c.json({ error: "Email already registered" }, 409);

    const accountId = uid();
    const patientId = uid();
    const token = uid() + uid();

    const account = { id: accountId, email: email.toLowerCase(), phone, name, passwordHash: btoa(password), createdAt: now(), role: "patient" };
    const patient = {
      id: patientId, accountId, name, dob: "", gender: "", relationship: "Self",
      allergies: [], medications: [], conditions: [], pastSurgeries: [], abhaId: "", abhaLinked: false, createdAt: now()
    };
    const session = { token, accountId, patientId, doctorId: null, name, email: email.toLowerCase(), role: "patient" };

    await kv.set(`account:${accountId}`, account);
    await kv.set(`patient:${patientId}`, patient);
    await kv.set(`token:${token}`, session);

    return c.json({ token, accountId, patientId, doctorId: null, name, email: email.toLowerCase(), role: "patient" });
  } catch (e) {
    console.log("Register error:", e);
    return c.json({ error: `Registration failed: ${e}` }, 500);
  }
});

app.post(`${PREFIX}/auth/login`, async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);

    // Check doctor accounts first
    const doctors = await kv.getByPrefix("doctor:");
    const doctor = doctors.find((d: any) => d.email === email.toLowerCase() && d.passwordHash === btoa(password));
    if (doctor) {
      const token = uid() + uid();
      const session = { token, accountId: doctor.id, patientId: null, doctorId: doctor.id, name: doctor.name, email: doctor.email, role: "doctor" };
      await kv.set(`token:${token}`, session);
      return c.json(session);
    }

    // Check patient accounts
    const accounts = await kv.getByPrefix("account:");
    const account = accounts.find((a: any) => a.email === email.toLowerCase() && a.passwordHash === btoa(password));
    if (!account) return c.json({ error: "Invalid email or password" }, 401);

    const patients = await kv.getByPrefix("patient:");
    const selfPatient = patients.find((p: any) => p.accountId === account.id && p.relationship === "Self");
    const token = uid() + uid();
    const session = { token, accountId: account.id, patientId: selfPatient?.id || null, doctorId: null, name: account.name, email: account.email, role: "patient" };
    await kv.set(`token:${token}`, session);
    return c.json(session);
  } catch (e) {
    console.log("Login error:", e);
    return c.json({ error: `Login failed: ${e}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTORS (seed + CRUD)
// ═══════════════════════════════════════════════════════════════════════════════
async function seedDoctors() {
  const existing = await kv.getByPrefix("doctor:");
  if (existing.length > 0) return;
  const doctors = [
    { id: uid(), name: "Dr. Anita Sharma", email: "anita@medbridge.app", passwordHash: btoa("Doctor@123"), specialty: "Cardiology", rating: 4.9, experience: 15, slots: ["09:00", "10:00", "11:00", "14:00", "15:00"], avatar: "AS", available: true },
    { id: uid(), name: "Dr. Rajesh Kumar", email: "rajesh@medbridge.app", passwordHash: btoa("Doctor@123"), specialty: "General Medicine", rating: 4.7, experience: 12, slots: ["09:30", "10:30", "11:30", "14:30", "16:00"], avatar: "RK", available: true },
    { id: uid(), name: "Dr. Priya Menon", email: "priya@medbridge.app", passwordHash: btoa("Doctor@123"), specialty: "Pediatrics", rating: 4.8, experience: 10, slots: ["09:00", "10:00", "11:00", "13:00", "15:00"], avatar: "PM", available: true },
    { id: uid(), name: "Dr. Arjun Nair", email: "doctor@medbridge.app", passwordHash: btoa("Doctor@123"), specialty: "Neurology", rating: 4.6, experience: 18, slots: ["10:00", "11:00", "14:00", "15:00", "16:00"], avatar: "AN", available: true },
    { id: uid(), name: "Dr. Sunita Rao", email: "sunita@medbridge.app", passwordHash: btoa("Doctor@123"), specialty: "Orthopedics", rating: 4.5, experience: 8, slots: ["09:00", "11:00", "14:00", "16:00"], avatar: "SR", available: true },
  ];
  for (const d of doctors) await kv.set(`doctor:${d.id}`, d);
}
seedDoctors();

app.get(`${PREFIX}/doctors`, async (c) => {
  try {
    const doctors = await kv.getByPrefix("doctor:");
    return c.json(doctors.map((d: any) => ({ id: d.id, name: d.name, specialty: d.specialty, rating: d.rating, experience: d.experience, slots: d.slots, avatar: d.avatar, available: d.available })));
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/doctors/:id`, async (c) => {
  try {
    const d = await kv.get(`doctor:${c.req.param("id")}`);
    if (!d) return c.json({ error: "Doctor not found" }, 404);
    return c.json(d);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════════════════════════════════════
app.get(`${PREFIX}/accounts/:accountId/patients`, async (c) => {
  try {
    const all = await kv.getByPrefix("patient:");
    const patients = all.filter((p: any) => p.accountId === c.req.param("accountId"));
    return c.json(patients);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.post(`${PREFIX}/patients`, async (c) => {
  try {
    const body = await c.req.json();
    const patient = {
      id: uid(), accountId: body.accountId, name: body.name, dob: body.dob || "", gender: body.gender || "",
      relationship: body.relationship || "Self", allergies: body.allergies || [], medications: body.medications || [],
      conditions: body.conditions || [], pastSurgeries: body.pastSurgeries || [], abhaId: "", abhaLinked: false, createdAt: now()
    };
    await kv.set(`patient:${patient.id}`, patient);
    return c.json(patient);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.put(`${PREFIX}/patients/:id`, async (c) => {
  try {
    const existing = await kv.get(`patient:${c.req.param("id")}`);
    if (!existing) return c.json({ error: "Patient not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id: existing.id };
    await kv.set(`patient:${updated.id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/patients/:id`, async (c) => {
  try {
    const p = await kv.get(`patient:${c.req.param("id")}`);
    if (!p) return c.json({ error: "Not found" }, 404);
    return c.json(p);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/appointments`, async (c) => {
  try {
    const body = await c.req.json();
    const appt = {
      id: uid(), patientId: body.patientId, doctorId: body.doctorId,
      date: body.date, slot: body.slot, reason: body.reason || "",
      status: "Pending", aiSummary: null, riskLevel: null, riskScore: null,
      criticalFlags: [], checkedIn: false, createdAt: now()
    };
    await kv.set(`appointment:${appt.id}`, appt);
    return c.json(appt, 201);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/appointments/patient/:patientId`, async (c) => {
  try {
    const all = await kv.getByPrefix("appointment:");
    const appts = all.filter((a: any) => a.patientId === c.req.param("patientId"));
    return c.json(appts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/appointments/doctor/:doctorId`, async (c) => {
  try {
    const all = await kv.getByPrefix("appointment:");
    const appts = all.filter((a: any) => a.doctorId === c.req.param("doctorId") && a.status !== "Cancelled");
    // Enrich with patient data
    const enriched = await Promise.all(appts.map(async (a: any) => {
      const patient = await kv.get(`patient:${a.patientId}`);
      return { ...a, patientName: patient?.name || "Unknown", patientAge: patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : null, patientAllergies: patient?.allergies || [], patientMedications: patient?.medications || [], patientConditions: patient?.conditions || [] };
    }));
    // Sort by risk: HIGH > MEDIUM > LOW > null
    const riskOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    enriched.sort((a: any, b: any) => (riskOrder[a.riskLevel] ?? 3) - (riskOrder[b.riskLevel] ?? 3));
    return c.json(enriched);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/appointments/:id`, async (c) => {
  try {
    const a = await kv.get(`appointment:${c.req.param("id")}`);
    if (!a) return c.json({ error: "Not found" }, 404);
    const patient = await kv.get(`patient:${a.patientId}`);
    const doctor = await kv.get(`doctor:${a.doctorId}`);
    return c.json({ ...a, patientName: patient?.name, doctorName: doctor?.name, doctorSpecialty: doctor?.specialty });
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.patch(`${PREFIX}/appointments/:id`, async (c) => {
  try {
    const existing = await kv.get(`appointment:${c.req.param("id")}`);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, ...body, id: existing.id };
    await kv.set(`appointment:${updated.id}`, updated);
    return c.json(updated);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE AI – Check-In Summary (Gemini)
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/appointments/:id/checkin`, async (c) => {
  try {
    const apptId = c.req.param("id");
    const { transcript, patientContext } = await c.req.json();

    let summary = "", riskLevel = "MEDIUM", criticalFlags: string[] = [], severityScore = 5, durationDays = 1, symptomCount = 1;

    const criticalKeywords = ["chest pain", "difficulty breathing", "loss of consciousness", "unconscious", "stroke", "heart attack", "can't breathe"];
    const hasCritical = criticalKeywords.some(k => transcript.toLowerCase().includes(k));
    if (hasCritical) criticalFlags.push(...criticalKeywords.filter(k => transcript.toLowerCase().includes(k)));

    if (GEMINI_KEY) {
      try {
        const systemPrompt = `You are an AI triage nurse analyzing a patient's symptom description. Extract structured data and generate a consultation summary.
Patient context: ${JSON.stringify(patientContext || {})}
Patient transcript: "${transcript}"

Respond ONLY with valid JSON (no markdown):
{
  "summary": "2-3 sentence clinical summary",
  "risk_level": "LOW|MEDIUM|HIGH",
  "critical_flags": [],
  "symptom_severity_score": 1-10,
  "symptom_duration_days": number,
  "symptom_count": number,
  "follow_up_question": "one follow-up question if needed"
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });
        const gemData = await res.json();
        let raw = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        summary = parsed.summary || "";
        riskLevel = hasCritical ? "HIGH" : (parsed.risk_level || "MEDIUM");
        criticalFlags = hasCritical ? criticalFlags : (parsed.critical_flags || []);
        severityScore = parsed.symptom_severity_score || 5;
        durationDays = parsed.symptom_duration_days || 1;
        symptomCount = parsed.symptom_count || 1;
      } catch (gemErr) {
        console.log("Gemini error, using fallback:", gemErr);
        summary = `Patient reports: ${transcript.slice(0, 200)}`;
        riskLevel = hasCritical ? "HIGH" : "MEDIUM";
      }
    } else {
      summary = `Patient reports: ${transcript.slice(0, 200)}`;
      riskLevel = hasCritical ? "HIGH" : "MEDIUM";
    }

    const { score } = computeRisk(severityScore, durationDays, hasCritical, 30, symptomCount);

    const appt = await kv.get(`appointment:${apptId}`);
    if (appt) {
      const updated = { ...appt, aiSummary: summary, riskLevel, riskScore: score, criticalFlags, checkedIn: true, transcript, updatedAt: now() };
      await kv.set(`appointment:${apptId}`, updated);
    }

    return c.json({ summary, riskLevel, riskScore: score, criticalFlags });
  } catch (e) {
    console.log("Check-in error:", e);
    return c.json({ error: `Check-in failed: ${e}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI FOLLOW-UP (Gemini conversational)
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/ai/followup`, async (c) => {
  try {
    const { message, history, mode, patientContext } = await c.req.json();

    if (!GEMINI_KEY) {
      const fallbacks: Record<string, string[]> = {
        triage: ["How long have you been experiencing this?", "On a scale of 1-10, how severe is the pain?", "Have you taken any medication for this?"],
        booking: ["Which doctor or specialty would you prefer?", "What date works best for you?", "Morning or afternoon appointment?"]
      };
      const arr = fallbacks[mode] || fallbacks.triage;
      return c.json({ response: arr[Math.floor(Math.random() * arr.length)] });
    }

    const systemPrompt = mode === "booking"
      ? `You are an AI appointment booking assistant for MedBridge. Help the patient book an appointment. Be concise and friendly. Ask one question at a time. Patient context: ${JSON.stringify(patientContext || {})}`
      : `You are Aarohi, an AI triage nurse at MedBridge. Collect symptom information through conversation. Ask ONE follow-up question at a time. Be empathetic and concise. NEVER diagnose. Patient context: ${JSON.stringify(patientContext || {})}`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history.map((h: any) => ({ role: h.role === "ai" ? "model" : "user", parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: message }] }
    ];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });
    const data = await res.json();
    const response = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could you please repeat that?";
    return c.json({ response: response.trim() });
  } catch (e) {
    console.log("AI followup error:", e);
    return c.json({ response: "I'm having trouble connecting. Could you please repeat?" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL IMAGING ANALYSIS (Gemini multimodal)
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/imaging/analyze`, async (c) => {
  try {
    const { imageBase64, mimeType } = await c.req.json();

    if (!GEMINI_KEY) {
      return c.json({
        imageType: "X-Ray", region: "Chest", abnormalities: ["Mild consolidation in lower lobe"],
        qualityScore: 0.85, confidence: 0.78,
        findings: "The chest X-ray shows mild consolidation in the lower lobe, suggesting possible pneumonia. No significant pleural effusion noted. Cardiac silhouette appears normal.",
        recommendations: "Clinical correlation recommended. Consider CBC and sputum culture."
      });
    }

    const prompt = `You are an expert medical imaging AI. Analyze this medical image and provide structured findings.
Respond ONLY with valid JSON (no markdown):
{
  "imageType": "X-Ray|MRI|CT Scan|Ultrasound|Other",
  "region": "anatomical region",
  "abnormalities": ["list", "of", "findings"],
  "qualityScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "findings": "detailed clinical description",
  "recommendations": "clinical recommendations"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });
    const data = await res.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return c.json(JSON.parse(raw));
  } catch (e) {
    console.log("Imaging error:", e);
    return c.json({ error: `Imaging analysis failed: ${e}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRESCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/prescriptions`, async (c) => {
  try {
    const body = await c.req.json();
    const prescription = {
      id: uid(), appointmentId: body.appointmentId, patientId: body.patientId, doctorId: body.doctorId,
      medications: body.medications || [], instructions: body.instructions || "",
      diagnosis: body.diagnosis || "", followUpDate: body.followUpDate || "",
      doctorName: body.doctorName || "", patientName: body.patientName || "",
      patientEmail: body.patientEmail || "", createdAt: now(), status: "sent"
    };
    await kv.set(`prescription:${prescription.id}`, prescription);

    // Update appointment to Completed
    const appt = await kv.get(`appointment:${body.appointmentId}`);
    if (appt) await kv.set(`appointment:${appt.id}`, { ...appt, status: "Completed", prescriptionId: prescription.id });

    return c.json(prescription, 201);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/prescriptions/patient/:patientId`, async (c) => {
  try {
    const all = await kv.getByPrefix("prescription:");
    return c.json(all.filter((p: any) => p.patientId === c.req.param("patientId")));
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

app.get(`${PREFIX}/prescriptions/:id`, async (c) => {
  try {
    const p = await kv.get(`prescription:${c.req.param("id")}`);
    if (!p) return c.json({ error: "Not found" }, 404);
    return c.json(p);
  } catch (e) { return c.json({ error: `${e}` }, 500); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ABHA (mock)
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/abha/generate-otp`, async (c) => {
  const { mobile } = await c.req.json();
  return c.json({ success: true, sessionId: uid(), message: `OTP sent to ${mobile}` });
});

app.post(`${PREFIX}/abha/verify-otp`, async (c) => {
  const { otp } = await c.req.json();
  if (otp === "123456") {
    const abhaNumber = Array.from({ length: 14 }, (_, i) => i === 2 || i === 6 || i === 10 ? "-" : Math.floor(Math.random() * 10)).join("");
    return c.json({ success: true, abhaNumber, abhaId: `${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}` });
  }
  return c.json({ error: "Invalid OTP" }, 400);
});

app.get(`${PREFIX}/abha/records`, async (c) => {
  return c.json([
    { id: uid(), date: "2024-11-15", facility: "Apollo Hospital, Delhi", type: "Prescription", description: "Hypertension medication - Amlodipine 5mg", downloadUrl: "#" },
    { id: uid(), date: "2024-09-03", facility: "Max Healthcare, Gurugram", type: "Lab Report", description: "Complete Blood Count + Lipid Profile", downloadUrl: "#" },
    { id: uid(), date: "2024-06-21", facility: "AIIMS, New Delhi", type: "Discharge Summary", description: "Post-operative care following appendectomy", downloadUrl: "#" },
  ]);
});

// ═══════════════════════════════════════════════════════════════════════════════
// RX SCANNER — Prescription Analysis + Ayurvedic Alternatives (Gemini)
// ═══════════════════════════════════════════════════════════════════════════════
app.post(`${PREFIX}/rx/scan`, async (c) => {
  try {
    const { imageBase64, mimeType } = await c.req.json();
    if (!imageBase64) return c.json({ error: "No image provided" }, 400);

    if (!GEMINI_KEY) {
      return c.json({ error: "GEMINI_API_KEY is not configured on the server. Please set it in your Supabase dashboard or use the client-side fallback." }, 501);
    }


    const prompt = `You are an expert medical AI with deep knowledge of both modern pharmacology and Ayurveda (Indian traditional medicine). 
Analyze this prescription image carefully and extract ALL medicines mentioned.

For EACH medicine, provide Ayurvedic alternatives that can COMPLEMENT or (where safe) substitute the medicine.

Respond ONLY with this exact JSON structure (no markdown, no explanation outside JSON):
{
  "patientName": "string or null",
  "doctorName": "string or null", 
  "date": "string or null",
  "clinic": "string or null",
  "medicines": [
    {
      "brandName": "Brand name from prescription",
      "genericName": "Generic/chemical name",
      "prescribedDose": "Exact dose and frequency as written",
      "treatsCondition": "What condition this medicine treats",
      "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
      "category": "Drug category (antibiotic/painkiller/etc)",
      "ayurvedaAlternatives": [
        {
          "name": "Ayurvedic herb/formulation name in English",
          "hindiName": "Name in Hindi (Devanagari script)",
          "form": "How it comes — tablet/powder/kadha/oil/capsule",
          "treats": "How this Ayurvedic medicine helps for this condition",
          "howToTake": "Specific dosage and method of preparation",
          "activeCompounds": "Key active compounds/phytochemicals",
          "safetyNote": "Important safety note, contraindications",
          "effectiveness": number between 50 and 95 representing estimated efficacy percentage
        }
      ],
      "lifestyleTips": ["Practical lifestyle/dietary tip 1", "tip 2", "tip 3", "tip 4"]
    }
  ],
  "generalAdvice": "Overall integrative health advice combining modern and Ayurvedic approaches"
}

Important rules:
- Provide 2-3 Ayurvedic alternatives per medicine
- Be specific with doses and preparation methods
- Always include safety notes — never suggest replacing critical medicines (insulin, cardiac, seizure) without a note to consult doctor
- If you cannot clearly read a medicine, still include it with your best interpretation
- Effectiveness should reflect published research quality, not claims`;

    // Multi-model fallback sequence for server-side stability
    const models = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
    let lastError: any = null;
    let gemData: any = null;

    for (const modelId of models) {
      try {
        console.log(`📡 Server AI: Attempting with ${modelId}...`);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
                ]
              }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
            })
          }
        );

        if (res.status === 429) {
          console.warn(`⚠️ Server Quota hit for ${modelId}. Trying next...`);
          continue;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API error ${res.status}`);
        }

        gemData = await res.json();
        if (gemData?.candidates?.[0]?.content?.parts?.[0]?.text) break;
      } catch (err: any) {
        lastError = err;
        console.error(`❌ Server Model ${modelId} failed:`, err.message);
      }
    }

    if (!gemData) {
       throw lastError || new Error("All clinical models are currently saturated.");
    }

    let raw = gemData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(raw);
      return c.json(parsed);
    } catch {
      console.log("JSON parse failed, raw:", raw.slice(0, 500));
      return c.json({ error: "Could not parse AI response. Please try a clearer image." }, 422);
    }
  } catch (e) {
    console.log("RX scan error:", e);
    return c.json({ error: `Prescription scan failed: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);