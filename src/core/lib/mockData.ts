/**
 * Mock Data Service for Clinical Triage and Diagnostics
 * Provides realistic healthcare data points for simulation.
 */

export interface Doctor {
  id: string; name: string; specialty: string;
  rating: number; experience: number; slots: string[];
  avatar: string; available: boolean;
  hospital: string; location: string; fee: number;
  languages: string[]; qualification: string;
}

export interface Appointment {
  id: string; patientId: string; doctorId: string;
  date: string; slot: string; reason: string; status: string;
  riskLevel: string | null; riskScore: number | null;
  checkedIn: boolean; aiSummary: string | null; createdAt: string;
}

export interface Medicine {
  brandName: string; genericName: string; prescribedDose: string;
  treatsCondition: string; sideEffects: string[]; category: string;
  ayurvedaAlternatives: AyurvedaAlt[]; lifestyleTips: string[];
}
export interface InventoryMedicine {
  id: string; name: string; genericName: string; price: number;
  stock: number; category: string; description: string;
  usageCount: number; // For reward calculation
}

// ─── Indian Doctors ───────────────────────────────────────────────────────────
export const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc-001", name: "Dr. Priya Sharma", specialty: "General Physician",
    rating: 4.9, experience: 12, fee: 500,
    slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
    avatar: "👩‍⚕️", available: true,
    hospital: "Apollo Clinic", location: "Bandra, Mumbai",
    languages: ["Hindi", "English", "Marathi"], qualification: "MBBS, MD (General Medicine)"
  },
  {
    id: "doc-002", name: "Dr. Rajesh Kumar", specialty: "Cardiologist",
    rating: 4.8, experience: 18, fee: 1200,
    slots: ["10:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"],
    avatar: "👨‍⚕️", available: true,
    hospital: "Fortis Hospital", location: "Koramangala, Bengaluru",
    languages: ["Hindi", "English", "Kannada"], qualification: "MBBS, MD, DM (Cardiology)"
  },
  {
    id: "doc-003", name: "Dr. Ananya Patel", specialty: "Paediatrician",
    rating: 4.9, experience: 10, fee: 800,
    slots: ["08:30 AM", "11:00 AM", "01:00 PM", "04:30 PM"],
    avatar: "👩‍⚕️", available: true,
    hospital: "Max Healthcare", location: "Saket, New Delhi",
    languages: ["Hindi", "English", "Gujarati"], qualification: "MBBS, MD (Paediatrics)"
  },
  {
    id: "doc-004", name: "Dr. Venkat Subramanian", specialty: "Orthopaedic Surgeon",
    rating: 4.7, experience: 15, fee: 1000,
    slots: ["09:30 AM", "12:00 PM", "03:30 PM"],
    avatar: "👨‍⚕️", available: true,
    hospital: "KIMS Hospital", location: "Secunderabad, Hyderabad",
    languages: ["Telugu", "English", "Hindi"], qualification: "MBBS, MS (Orthopaedics)"
  },
  {
    id: "doc-005", name: "Dr. Fatima Shaikh", specialty: "Gynaecologist",
    rating: 4.8, experience: 14, fee: 900,
    slots: ["08:00 AM", "10:30 AM", "01:30 PM", "04:00 PM"],
    avatar: "👩‍⚕️", available: true,
    hospital: "Ruby Hall Clinic", location: "Pune",
    languages: ["Urdu", "Hindi", "English", "Marathi"], qualification: "MBBS, MS (Obs & Gynae)"
  },
  {
    id: "doc-006", name: "Dr. Arun Menon", specialty: "Dermatologist",
    rating: 4.6, experience: 9, fee: 700,
    slots: ["10:00 AM", "12:30 PM", "03:00 PM", "05:30 PM"],
    avatar: "👨‍⚕️", available: true,
    hospital: "Aster Medcity", location: "Kochi, Kerala",
    languages: ["Malayalam", "English", "Hindi"], qualification: "MBBS, MD (Dermatology)"
  },
];

// ─── Today's date helper ──────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

// ─── Mock Appointments (Indian context) ────────────────────────────────────────
export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "appt-001", patientId: "demo-patient-001", doctorId: "doc-001",
    date: tomorrow, slot: "10:00 AM", reason: "Recurring fever with cold since 3 days",
    status: "Confirmed", riskLevel: "MEDIUM", riskScore: 62, checkedIn: false,
    aiSummary: "Patient reports 3-day history of fever (101–102°F), dry cough, and nasal congestion. Likely viral URTI. Recommending paracetamol + steam inhalation. Monitor for bacterial superinfection.",
    createdAt: yesterday
  },
  {
    id: "appt-002", patientId: "demo-patient-001", doctorId: "doc-002",
    date: today, slot: "03:00 PM", reason: "Chest pain and breathlessness on exertion",
    status: "Confirmed", riskLevel: "HIGH", riskScore: 88, checkedIn: false,
    aiSummary: "High-risk cardiac presentation. Patient experiencing exertional chest pain (3/10) and breathlessness at 2 flights of stairs. Immediate ECG and cardiac enzyme panel ordered. History of hypertension.",
    createdAt: yesterday
  },
  {
    id: "appt-003", patientId: "demo-patient-001", doctorId: "doc-003",
    date: yesterday, slot: "09:00 AM", reason: "Child's vaccination — 15-month schedule",
    status: "Completed", riskLevel: "LOW", riskScore: 10, checkedIn: true,
    aiSummary: "15-month MMR, Varicella, and Hepatitis A vaccines administered. No adverse reactions. Next scheduled at 18 months. Growth parameters normal (weight: 10.2kg, height: 78cm).",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0]
  },
];

// ─── Mock Nearby Clinics ──────────────────────────────────────────────────────
export interface Clinic { id: string; name: string; address: string; phone: string; distance: string; type: string; rating: number; hours: string; }
export const MOCK_CLINICS: Clinic[] = [
  { id: "cl-001", name: "Apollo Clinic", address: "Shop 12, Bandra West, Mumbai 400050", phone: "022-6789-0123", distance: "0.6 km", type: "Multi-specialty", rating: 4.8, hours: "8 AM – 10 PM" },
  { id: "cl-002", name: "Jan Aushadhi Kendra", address: "Near Bus Stand, Andheri East, Mumbai", phone: "022-2654-3210", distance: "1.2 km", type: "Government Pharmacy", rating: 4.5, hours: "9 AM – 7 PM" },
  { id: "cl-003", name: "Fortis Emergency", address: "Mulund West, Mumbai 400080", phone: "022-4567-8900", distance: "3.1 km", type: "Hospital Emergency", rating: 4.7, hours: "24/7" },
  { id: "cl-004", name: "PHC — Ward 74", address: "Dharavi, Mumbai 400017", phone: "022-2407-0100", distance: "2.4 km", type: "Primary Health Centre", rating: 4.2, hours: "8 AM – 2 PM" },
];

// ─── Mock Prescriptions ───────────────────────────────────────────────────────
export interface Prescription { id: string; doctorName: string; patientName: string; date: string; medicines: Medicine[]; generalAdvice: string; }
export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-001", doctorName: "Dr. Priya Sharma", patientName: "Rahul Sharma",
    date: yesterday,
    medicines: [
      {
        brandName: "Dolo 650", genericName: "Paracetamol 650mg", prescribedDose: "1 tab TDS after food",
        treatsCondition: "Fever and pain", sideEffects: ["Liver strain if overdosed", "Nausea"], category: "Antipyretic",
        ayurvedaAlternatives: [{
          name: "Sudarshan Ghanvati", hindiName: "सुदर्शन घनवटी", form: "Tablet",
          treats: "Fever, flu, and chills", howToTake: "2 tablets twice daily with warm water",
          activeCompounds: "Chirayata, Guduchi, Musta", effectiveness: 82,
          safetyNote: "Safe for all ages. Avoid if pregnant."
        }],
        lifestyleTips: ["Stay hydrated — 3L water daily", "Avoid cold food and drinks", "Rest well"]
      },
      {
        brandName: "Amoxyclav 625", genericName: "Amoxicillin + Clavulanate 625mg", prescribedDose: "1 tab BD for 5 days",
        treatsCondition: "Bacterial upper respiratory infection", sideEffects: ["Diarrhoea", "Skin rash", "Nausea"], category: "Antibiotic",
        ayurvedaAlternatives: [{
          name: "Giloy (Guduchi) Kwath", hindiName: "गिलोय क्वाथ", form: "Kadha (decoction)",
          treats: "Immunity boost, bacterial infections",
          howToTake: "30ml twice daily before meals",
          activeCompounds: "Tinospora cordifolia alkaloids", effectiveness: 74,
          safetyNote: "Do NOT replace antibiotics without doctor advice. Use as adjunct therapy."
        }],
        lifestyleTips: ["Complete the full course", "Eat probiotic-rich foods (curd, chaas)", "Avoid alcohol"]
      }
    ],
    generalAdvice: "Rest for 3 days. Steam inhalation twice daily. Follow up if fever persists beyond 5 days or rash appears. Diet: khichdi, dal, sabzi. Avoid cold, spicy, and oily food."
  }
];

// ─── Mock Patient Profile (Indian) ────────────────────────────────────────────
export const MOCK_PATIENT_PROFILE = {
  name: "Rahul Sharma", dob: "1995-08-15", gender: "Male",
  bloodGroup: "B+", abhaId: "14-1234-5678-9012",
  address: "Flat 402, Krishna Society, Andheri West, Mumbai 400058",
  phone: "+91 93725 41301", emergencyContact: "Sunita Sharma — +91 98456 12090",
  allergies: ["Penicillin", "Sulfa drugs"], conditions: ["Mild Hypertension"],
  medications: ["Amlodipine 5mg OD"],
};

// ─── Mock Doctor Queue (for Doctor Dashboard) ─────────────────────────────────
export interface QueuePatient {
  id: string; patientId: string; name: string; age: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW"; riskScore: number;
  slot: string; reason: string; aiSummary: string; checkedIn: boolean;
  symptoms: string[]; vitals: { bp: string; temp: string; spo2: string; pulse: string };
}

export const MOCK_DOCTOR_QUEUE: QueuePatient[] = [
  {
    id: "q-001", patientId: "p-001", name: "Arvind Mehta", age: 58,
    riskLevel: "HIGH", riskScore: 91, slot: "09:00 AM",
    reason: "Severe chest pain radiating to left arm since 30 mins",
    checkedIn: true,
    symptoms: ["Chest pain", "Left arm numbness", "Sweating", "Nausea"],
    vitals: { bp: "165/105 mmHg", temp: "37.1°C", spo2: "94%", pulse: "108 bpm" },
    aiSummary: "⚠️ HIGH RISK: Classic ACS presentation. Immediate ECG required. Troponin levels pending. Patient diabetic (HbA1c 9.2%). Refer for urgent cardiology consult."
  },
  {
    id: "q-002", patientId: "p-002", name: "Sunita Rao", age: 32,
    riskLevel: "MEDIUM", riskScore: 54, slot: "10:00 AM",
    reason: "Recurring headaches for 2 weeks",
    checkedIn: true,
    symptoms: ["Throbbing headache", "Photophobia", "Nausea"],
    vitals: { bp: "128/84 mmHg", temp: "36.9°C", spo2: "99%", pulse: "76 bpm" },
    aiSummary: "Likely tension headache or migraine. No neurological deficits noted. Recommend sumatriptan trial + lifestyle modification. Rule out hypertension-driven headache."
  },
  {
    id: "q-003", patientId: "p-003", name: "Pratap Singh", age: 45,
    riskLevel: "LOW", riskScore: 22, slot: "11:00 AM",
    reason: "Follow-up — diabetes management",
    checkedIn: false,
    symptoms: ["Increased thirst", "Fatigue"],
    vitals: { bp: "122/78 mmHg", temp: "36.6°C", spo2: "99%", pulse: "72 bpm" },
    aiSummary: "Routine T2DM follow-up. Previous HbA1c 7.8% (3 months ago). Patient on Metformin 500mg BD. Advise fasting glucose today. Reinforce dietary compliance."
  },
  {
    id: "q-004", patientId: "p-004", name: "Meena Pillai", age: 67,
    riskLevel: "HIGH", riskScore: 79, slot: "12:00 PM",
    reason: "High BP reading at home — 190/110",
    checkedIn: false,
    symptoms: ["Severe headache", "Dizziness", "Blurry vision"],
    vitals: { bp: "188/112 mmHg", temp: "37.0°C", spo2: "97%", pulse: "88 bpm" },
    aiSummary: "Hypertensive urgency. Current antihypertensives: Telmisartan 40mg + Amlodipine 5mg. Consider dose escalation. Review 24hr ABPM. Rule out secondary cause."
  },
  {
    id: "q-005", patientId: "p-005", name: "Rohan Verma", age: 8,
    riskLevel: "MEDIUM", riskScore: 45, slot: "02:00 PM",
    reason: "Fever and ear pain — 4 days",
    checkedIn: false,
    symptoms: ["Fever 102°F", "Right ear pain", "Decreased hearing"],
    vitals: { bp: "100/65 mmHg", temp: "38.6°C", spo2: "98%", pulse: "110 bpm" },
    aiSummary: "Suspected right sided otitis media in paediatric patient. Conduct otoscopy. If confirmed, prescribe Amoxicillin 40mg/kg/day for 7 days. Reassess in 48 hours."
  },
];

export const MOCK_INVENTORY: InventoryMedicine[] = [
  // Cardiovascular
  { id: "nlem-001", name: "Atorva 10", genericName: "Atorvastatin 10mg", price: 84, stock: 120, category: "Cardiovascular", description: "Cholesterol-lowering statin for heart health.", usageCount: 890 },
  { id: "nlem-002", name: "Amlokind 5", genericName: "Amlodipine 5mg", price: 28, stock: 200, category: "Cardiovascular", description: "Calcium channel blocker for hypertension.", usageCount: 1200 },
  { id: "nlem-003", name: "Telma 40", genericName: "Telmisartan 40mg", price: 165, stock: 90, category: "Cardiovascular", description: "ARB for chronic blood pressure management.", usageCount: 1500 },
  
  // Anti-Infectives
  { id: "nlem-004", name: "Amoxyclav 625", genericName: "Amoxicillin + Clavulanate", price: 198, stock: 45, category: "Anti-Infectives", description: "Broad-spectrum oral antibiotic.", usageCount: 600 },
  { id: "nlem-005", name: "Azithral 500", genericName: "Azithromycin 500mg", price: 119, stock: 60, category: "Anti-Infectives", description: "Used for respiratory and skin infections.", usageCount: 450 },
  { id: "nlem-006", name: "Ciplox 500", genericName: "Ciprofloxacin 500mg", price: 42, stock: 110, category: "Anti-Infectives", description: "Fluoroquinolone antibiotic for various infections.", usageCount: 320 },
  
  // Analgesics & Antipyretics
  { id: "nlem-007", name: "Dolo 650", genericName: "Paracetamol 650mg", price: 31, stock: 500, category: "Analgesics", description: "Safe and effective for fever and mild pain.", usageCount: 5000 },
  { id: "nlem-008", name: "Combiflam", genericName: "Ibuprofen + Paracetamol", price: 45, stock: 300, category: "Analgesics", description: "Relieves muscle pain and inflammation.", usageCount: 2100 },
  
  // Gastrointestinal
  { id: "nlem-009", name: "Pantocid 40", genericName: "Pantoprazole 40mg", price: 145, stock: 180, category: "Gastrointestinal", description: "Proton pump inhibitor for acidity and ulcers.", usageCount: 1800 },
  { id: "nlem-010", name: "Digene Gel", genericName: "Magnesia + Alumina + Simethicone", price: 185, stock: 50, category: "Gastrointestinal", description: "Antacid and anti-gas relief syrup (200ml).", usageCount: 950 },
  
  // Endocrine / Diabetes
  { id: "nlem-011", name: "Glycomet 500", genericName: "Metformin 500mg", price: 21, stock: 400, category: "Endocrine", description: "First-line medication for Type-2 Diabetes.", usageCount: 3500 },
  { id: "nlem-012", name: "Lantus Solostar", genericName: "Insulin Glargine", price: 680, stock: 15, category: "Endocrine", description: "Long-acting insulin analogue for glycemic control.", usageCount: 150 },
  
  // Respiratory
  { id: "nlem-013", name: "Asthalin Inhaler", genericName: "Salbutamol 100mcg", price: 148, stock: 40, category: "Respiratory", description: "Rescue inhaler for asthma and bronchospasm.", usageCount: 400 },
  { id: "nlem-014", name: "Montair LC", genericName: "Montelukast + Levocetirizine", price: 210, stock: 85, category: "Respiratory", description: "Relieves allergic rhinitis and asthma symptoms.", usageCount: 780 },

  // Vitamins & Minerals
  { id: "nlem-015", name: "Shelcal 500", genericName: "Calcium + Vitamin D3", price: 120, stock: 250, category: "Supplements", description: "Essential for bone and joint health.", usageCount: 2400 },
  { id: "nlem-016", name: "Becosules Z", genericName: "B-Complex + Vit C + Zinc", price: 48, stock: 200, category: "Supplements", description: "Vitalizing multivitamin for immunity.", usageCount: 1900 },
];

// ─── Booking Time Slots ───────────────────────────────────────────────────────
export const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM",
  "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "01:00 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM",
];

// ─── CureSathi Voice Booking Responses (Indian context) ────────────────────────
export const VOICE_BOOKING_RESPONSES = {
  greet: "नमस्ते! I'm CureSathi, your AI health companion. Tell me — which doctor or specialty would you like to book with? I can help you in English or Hindi.",
  askSymptoms: "Could you briefly describe your main symptoms? This helps me match you with the right specialist.",
  confirmDoctor: (name: string, slot: string) => `I've found ${name} available at ${slot}. Shall I confirm this booking? Say 'हाँ' or 'yes' to confirm.`,
  bookingDone: "✅ Booking confirmed! You'll receive an SMS on your registered mobile. Our CureSathi AI will analyze your symptoms before the consultation for faster care.",
  fallback: "Sorry, I didn't catch that. Please try again or use manual booking below.",
};

// ─── Mock API — drops-in as replacement for broken Edge Function ──────────────
export const mockApi = {
  getDoctors: (): Doctor[] => MOCK_DOCTORS,
  getDoctor: (id: string): Doctor | undefined => MOCK_DOCTORS.find(d => d.id === id),
  getAppointments: (patientId: string): Appointment[] =>
    MOCK_APPOINTMENTS.filter(a => a.patientId === patientId || patientId.startsWith("local-") || patientId.startsWith("demo-")),
  getDoctorQueue: (doctorId: string): QueuePatient[] => MOCK_DOCTOR_QUEUE,
  getPrescriptions: (patientId: string): Prescription[] => MOCK_PRESCRIPTIONS,
  getNearbyClinics: (): Clinic[] => MOCK_CLINICS,
  getMedicines: (): InventoryMedicine[] => MOCK_INVENTORY,
  getRewardPoints: (patientId: string): number => 1250, // Static demo points
  redeemPoints: (points: number) => {
    // console.log(`Redeemed ${points}`);
    return true;
  },

  bookAppointment: (data: {
    patientId: string; doctorId: string; date: string; slot: string; reason: string;
  }): Appointment => ({
    id: `appt-${Date.now()}`,
    patientId: data.patientId,
    doctorId: data.doctorId,
    date: data.date,
    slot: data.slot,
    reason: data.reason,
    status: "Confirmed",
    riskLevel: null, riskScore: null,
    checkedIn: false, aiSummary: null,
    createdAt: new Date().toISOString().split("T")[0],
  }),
  getMockRxResult: () => ({
    patientName: "Rahul Sharma",
    doctorName: "Dr. Anirudh Raje",
    date: "14-04-2026",
    clinic: "Shanti Niwas, Bandra",
    confidenceScore: 94,
    medicines: [
      {
        brandName: "Cap. Subitral",
        genericName: "Itraconazole 130mg",
        prescribedDose: "1 cap morning (after food) for 10 days",
        treatsCondition: "Fungal infection",
        sideEffects: ["Nausea", "Liver enzyme shift", "Stomach ache"],
        category: "Antifungal",
        ayurvedaAlternatives: [{
          name: "Neem Ghanvati", hindiName: "नीम घनवटी", form: "Tablet",
          treats: "Skin infections, blood purification", howToTake: "2 tabs empty stomach with warm water",
          activeCompounds: "Azadirachtin, Nimbin", effectiveness: 88,
          safetyNote: "Effective adjunct for fungal issues. Avoid if planning pregnancy."
        }],
        genericSubstitutes: [
          { name: "Itraconazole (Generic)", price: 45, manufacturer: "Jan Aushadhi" },
          { name: "Itaspor 100", price: 110, manufacturer: "Intas" }
        ],
        lifestyleTips: ["Keep skin dry", "Wear cotton clothes", "Avoid public pools"]
      },
      {
        brandName: "Gentalene Plus Cream",
        genericName: "Gentamicin + Beclomethasone + Clotrimazole",
        prescribedDose: "Apply twice daily (morning & night)",
        treatsCondition: "Mixed skin infection / inflammation",
        sideEffects: ["Skin thinning", "Redness", "Burning sensation"],
        category: "Topical Antibiotic/Steroid/Antifungal",
        ayurvedaAlternatives: [{
          name: "Gandhak Rasayan", hindiName: "गंधक रसायन", form: "Powder/Tablet",
          treats: "Chronic skin conditions, itching", howToTake: "500mg with honey or warm water",
          activeCompounds: "Purified Sulphur", effectiveness: 91,
          safetyNote: "Highly effective for skin 'pitta'. Consult for dosage."
        }],
        genericSubstitutes: [
          { name: "Betamethasone + Gentamicin (Generic)", price: 18, manufacturer: "Cipla Generic" }
        ],
        lifestyleTips: ["Avoid spicy food", "Use mild soap", "Don't scratch the area"]
      }
    ],
    generalAdvice: "Ensure complete antifungal course even if symptoms disappear. Maintain strict personal hygiene. Avoid sugar-heavy diet during infection.",
  }),
};
