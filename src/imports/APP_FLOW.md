# MedBridge – Application Flow Documentation
**Version**: 1.0 | **Hackathon**: Hawkathon 2026 – Track 3: Healthcare  
**Stack**: React + Vite (Patient Portal) | Next.js + Shadcn (Doctor Portal) | FastAPI + PostgreSQL + Gemini 2.0 + LangGraph + Deepgram

---

## 1. Entry Points

### Primary Entry Points

| Entry Point | URL | Description / Flow Trigger |
|---|---|---|
| **Patient Portal – Direct URL** | `medbridge.vercel.app` | Loads the Patient Portal landing page (React + Vite). Unauthenticated users see a landing screen with Login / Register CTAs. Authenticated patients land directly on their dashboard. |
| **Doctor Dashboard – Direct URL** | `doctor.medbridge.vercel.app` | Loads the Doctor Portal (Next.js + Shadcn). Requires doctor-role JWT. Unauthenticated users redirected to login. |
| **Deep Links (Email / Notification)** | Dynamic path in email body | Links embedded in prescription confirmation emails, appointment confirmation emails, and WebSocket-triggered doctor alert emails. Each deep link routes to a specific screen with context pre-loaded. |
| **Voice Shortcut Entry (PWA)** | Homescreen icon → `/check-in` | Patient taps the MedBridge PWA icon installed on Android/iOS homescreen. Service worker serves cached app shell; opens directly on the Voice Check-In screen. No re-login required if JWT is still valid in memory. |
| **OAuth / Social Login** | `/auth/google` | Google Sign-In (optional future enhancement). MVP supports email + password JWT accounts only. |

### Secondary Entry Points

| Entry Point | Description |
|---|---|
| **ABHA Health ID Deep Link** | URL shared by clinic or SMS with pre-filled ABHA link flow. Routes to `/profile/abha`. |
| **Prescription Email PDF Link** | "Download Prescription" button in the prescription email routes to `/prescriptions/:id/download`. Accessible without full login via a signed token. |
| **Doctor Accept/Reject Email CTA** | SendGrid email sent to doctor includes "View Queue" link → routes to `doctor.medbridge.vercel.app/dashboard`. |

---

## 2. Core User Flows

---

### Flow 1: Patient Registration & Onboarding

**Goal**: New patient creates an account and sets up their health profile.  
**Entry Point**: Patient Portal landing page → "Register" CTA  
**Frequency**: Once per user  
**Actor**: Patient (Priya persona)

#### Happy Path

1. **Screen: Landing Page** (`/`)
   - Elements: MedBridge logo, hero tagline, "Book Appointment" CTA, "Login" + "Register" buttons
   - User Action: Clicks "Register"
   - Trigger: Navigate to `/register`

2. **Screen: Registration Form** (`/register`)
   - Elements: Full name input, email input, phone number input, password input, confirm password, "Create Account" button
   - User Actions: Fills all fields
   - Validation (client-side, instant):
     - Email format check
     - Phone: 10-digit Indian mobile number
     - Password: minimum 8 characters, at least one number
     - Confirm password match
   - Trigger: Submits form → POST `/api/auth/register`

3. **System Action**: Backend creates `accounts` record. JWT issued and stored in memory (not localStorage).

4. **Screen: Health Profile Setup** (`/onboarding/profile`)
   - Elements: DOB picker, gender selector, "Add Family Member" option, "Skip for now" link
   - User Action: Fills basic profile OR skips
   - Trigger: Proceeds to Family Setup or Dashboard

5. **Screen: Family Members Setup** (`/onboarding/family`) *(optional)*
   - Elements: "Add Member" card – name, relationship dropdown (Self/Spouse/Child/Parent), DOB, known allergies, current medications
   - User Action: Adds one or more family members OR skips
   - Trigger: Navigate to Patient Dashboard

6. **Screen: Patient Dashboard** (`/dashboard`)
   - Success State: Welcome banner, onboarding checklist (Book first appointment, Complete health profile, Install PWA)

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| Email already registered | Inline error below email field + "Login instead?" link | User clicks link → redirected to `/login` |
| Invalid phone number | Inline error: "Enter a valid 10-digit mobile number" | User corrects field |
| Weak password | Password strength indicator bar (red → green) | User strengthens password |
| Server error on submit | Toast: "Something went wrong. Please try again." | Retry button; form data preserved |

#### Edge Cases
- User closes browser mid-registration → Form state held in React state for session duration; on return they must re-enter
- User registers on mobile PWA → Same flow, single-column layout, each field full-width
- User submits with missing required fields → All fields highlighted, scroll to first error

#### Exit Points
- **Success**: `/dashboard` (logged in)
- **Abandon**: Close/navigate away → no account created until form submitted
- **Redirect**: `/login` if email already exists

---

### Flow 2: Voice-Based Appointment Booking (Scheduling Mode)

**Goal**: Patient books a doctor appointment using voice input.  
**Entry Point**: Patient Dashboard → "Book Appointment" or Voice Shortcut (PWA homescreen)  
**Frequency**: Primary recurring flow  
**PDF Outcome**: 3.1 – Voice-Based Appointment Scheduling  
**Actor**: Patient (Priya / Ramesh persona via family switcher)

#### Happy Path

1. **Screen: Patient Dashboard** (`/dashboard`)
   - Elements: Doctor list cards (specialty, rating, slots), "Book Appointment" button, "Start Voice Booking" mic button
   - User Action: Clicks "Start Voice Booking"
   - Trigger: Navigate to `/book/voice`

2. **Screen: Voice Booking Agent** (`/book/voice`)
   - Elements: Animated mic waveform, real-time transcript display, AI response text bubble, "Cancel" button
   - System: Deepgram SDK activates (primary) or Web Speech API (fallback). Browser mic permission prompt appears if not yet granted.
   - AI speaks (TTS): "Welcome to MedBridge. Which doctor or specialty would you like to book with?"
   - User Action: Speaks – e.g., "Book me with Dr. Sharma for Friday morning"
   - System: Deepgram transcribes in real time; transcript appears on screen

3. **System Action**: LangGraph agent (Scheduling Mode) parses intent → queries available slots from DB → returns top 3 slots

4. **AI Response (TTS + Text)**: "Dr. Sharma has slots available Friday at 10 AM, 11 AM, and 2 PM. Which do you prefer?"
   - User Action: Speaks – "10 AM please"

5. **System Action**: POST `/api/appointments` – creates appointment record with status `Pending`. Returns appointment ID.

6. **AI Response (TTS + Text)**: "Done! Your appointment with Dr. Sharma is confirmed for Friday at 10 AM."

7. **Screen: Booking Confirmation** (`/booking/confirmation/:id`)
   - Elements: Appointment summary card (doctor, time, slot), appointment ID, "Start Symptom Check-In" CTA, "Back to Dashboard" link
   - System: SendGrid fires confirmation email to patient

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| Microphone permission denied | Error banner: "Microphone access is required." | Link to browser settings guide; fallback to manual booking at `/book/manual` |
| No slots available | AI speaks: "Dr. Sharma has no Friday slots. The next available is Monday at 9 AM." | Patient accepts alternative verbally or says "Show me other doctors" |
| STT transcription failed | AI: "I didn't catch that. Could you please repeat?" | Re-prompt up to 2 times; then offer manual booking fallback |
| Network timeout | Toast: "Connection issue. Switching to manual booking." | Auto-redirect to `/book/manual` |

#### Edge Cases
- Patient books for a family member → Active patient context (via family switcher) determines whose appointment is created
- Patient says ambiguous doctor name → AI lists multiple matches: "Do you mean Dr. Anita Sharma (Cardiology) or Dr. Priya Sharma (General)?"
- Patient is on PWA offline → Offline banner shown; booking queued and submitted when connection restores

#### Exit Points
- **Success**: `/booking/confirmation/:id`
- **Fallback**: `/book/manual` (form-based booking)
- **Abandon**: `/dashboard`

---

### Flow 3: Voice Symptom Check-In (AI Triage)

**Goal**: Patient describes symptoms by voice; AI generates structured summary for doctor.  
**Entry Point**: Booking Confirmation screen → "Start Symptom Check-In" OR Dashboard → "Check In Now"  
**Frequency**: Once per appointment  
**PDF Outcome**: 3.2 – AI-Generated Patient Issue Summary  
**Actor**: Patient

#### Happy Path

1. **Screen: Voice Check-In** (`/checkin/:appointmentId`)
   - Elements: AI nurse avatar, mic waveform, transcript panel, "Skip Check-In" link
   - AI speaks (TTS): "Hi [Patient Name], I'm your AI triage nurse. Can you describe what's been bothering you today?"
   - User Action: Speaks symptoms – e.g., "I've had a high fever and bad headache for 3 days"
   - System: Deepgram transcribes; transcript shown in real time

2. **System Action**: LangGraph triage agent processes utterance → generates 1 follow-up question

3. **AI Follow-up (TTS + Text)**: "Have you noticed any neck stiffness or sensitivity to light?"
   - User Action: Responds verbally
   - System: Up to 3 follow-up exchanges (configurable)

4. **System Action**: Gemini 2.0 Flash generates structured JSON summary:
   ```json
   {
     "summary": "Patient reports high fever and severe headache for 3 days. Mild light sensitivity reported.",
     "risk_level": "MEDIUM",
     "critical_flags": [],
     "symptom_severity_score": 6,
     "symptom_duration_days": 3
   }
   ```

5. **System Action (parallel)**:
   - POST `/api/appointments/:id/summary` – stores summary + risk_level in DB
   - XGBoost risk engine scores patient → maps to LOW / MEDIUM / HIGH badge
   - WebSocket pushes real-time alert to Doctor Dashboard
   - SendGrid notification email sent to doctor

6. **Screen: Check-In Complete** (`/checkin/:appointmentId/complete`)
   - Elements: Animated checkmark, "Your doctor has been notified" message, appointment time reminder, "Back to Dashboard" button, Sukoon stress-relief widget

#### Critical Override Logic
- If patient mentions "chest pain", "difficulty breathing", or "loss of consciousness" → `critical_flag = 1` → risk_level auto-set to **HIGH** → Doctor receives urgent WebSocket alert

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| Gemini API timeout | "AI summary is taking longer than expected. We'll notify your doctor when it's ready." | Retry once; if failed, store transcript only, flag as `summary_pending` |
| Patient gives unclear answers | AI asks one clarifying question. If still unclear, proceeds with available data. | Partial summary stored; flagged with `low_confidence: true` |

#### Exit Points
- **Success**: `/checkin/:id/complete` → Sukoon waiting room
- **Skip**: Patient skips → no summary pushed to doctor
- **Abandon**: `/dashboard`

---

### Flow 4: Doctor Dashboard – Patient Queue & Risk Review

**Goal**: Doctor views upcoming appointments sorted by ML risk score, reviews AI summaries, accepts/rejects appointments.  
**Entry Point**: `doctor.medbridge.vercel.app/dashboard`  
**Frequency**: Multiple times daily  
**PDF Outcome**: 3.3 – Doctor Portal with Risk Prioritization  
**Actor**: Doctor (Dr. Arjun persona)

#### Happy Path

1. **Screen: Doctor Login** (`/login`)
   - Elements: Email input, password input, "Doctor Login" button
   - System: POST `/api/auth/login` → JWT returned (doctor role)
   - Trigger: Navigate to `/dashboard`

2. **Screen: Doctor Dashboard – Appointment Queue** (`/dashboard`)
   - Elements:
     - Sortable appointment table (default: sorted HIGH → MEDIUM → LOW risk)
     - Per-patient row: patient name, relationship tag, appointment time, risk badge (RED/ORANGE/GREEN), AI summary preview
     - Per-row action buttons: **Accept** | **Reschedule** | **Reject**
     - WebSocket connection indicator (live)
     - Notification bell (badge count for new check-ins)
     - Risk distribution chart (Recharts donut)
   - System: WebSocket connection established on page load; real-time updates for new check-ins

3. **User Action**: Doctor clicks a patient row to expand
   - Elements: Full AI-generated summary, critical_flags highlighted in red, patient age, allergies, current medications, appointment history
   - User Action: Clicks **Accept**
   - System: PATCH `/api/appointments/:id` → status: `Confirmed` → patient notified via WebSocket + email

4. **User Action**: Doctor clicks **Reschedule**
   - Elements: Date-time picker modal
   - System: Updates appointment slot → notifies patient

5. **User Action**: Doctor clicks **Reject**
   - Elements: Reason input (optional) → Confirm modal
   - System: Appointment status → `Cancelled` → patient notified

#### Real-Time WebSocket Update Flow
- New patient completes check-in → WebSocket event fires → patient card appears in doctor's queue instantly (< 2s) without page refresh
- HIGH risk patient → card slides to top of queue + red badge pulses

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| WebSocket connection lost | Yellow banner: "Live updates paused. Reconnecting…" | Auto-reconnect every 5s; manual "Refresh" button |
| No appointments today | Empty state: "No appointments scheduled today." | "View past appointments" link |
| Accept action fails | Toast: "Could not confirm appointment. Please try again." | Retry button; appointment stays `Pending` |

#### Exit Points
- **Active Consultation**: Doctor clicks "Start Consultation" → enters Whiteboard + Prescription flow
- **Logout**: `/login`

---

### Flow 5: Active Consultation – Whiteboard & Prescription

**Goal**: Doctor conducts consultation using the digital whiteboard and sends a digital prescription.  
**Entry Point**: Doctor Dashboard → "Start Consultation" button on a confirmed appointment  
**Frequency**: Once per appointment  
**PDF Outcomes**: 3.4 (Whiteboard) + 3.5 (Prescription)  
**Actor**: Doctor

#### Happy Path

1. **Screen: Active Consultation** (`/consultation/:appointmentId`)
   - Elements:
     - Left panel: Patient AI summary (read-only), patient health history (allergies, medications)
     - Right panel: Fabric.js digital whiteboard canvas
     - Whiteboard toolbar: Pen, Highlighter, Text label, Circle, Rectangle, Eraser, Clear All, Export PNG
     - Colour palette: red, blue, black, green
     - "End Consultation & Send Prescription" button (sticky footer)
     - Optional: "Upload Medical Scan" drag-and-drop zone

2. **User Action**: Doctor draws on whiteboard (anatomy diagram, annotations)
   - Fabric.js handles touch/mouse/stylus input natively
   - "Export PNG" saves canvas to patient record

3. *(Optional)* **User Action**: Doctor drags an X-ray/MRI/CT image onto the scan upload zone
   - System: POST `/api/imaging/analyze` with base64 image → Gemini 2.0 Flash multimodal analysis
   - **Screen: Imaging Panel** (slide-in panel)
     - Elements: Uploaded image preview, AI analysis results: `{ image_type, region, abnormalities, quality_score, confidence }`

4. **User Action**: Doctor clicks "End Consultation & Send Prescription"
   - **Screen: Prescription Form** (modal overlay)
     - Elements: Medication name(s), dosage, frequency, duration, special instructions, patient name (pre-filled), doctor signature
     - Trigger: Clicks "Send Prescription"

5. **System Action**:
   - PDFKit generates styled prescription PDF
   - SendGrid emails PDF to patient's registered Gmail
   - Subject: "Your Prescription from Dr. [Name] – MedBridge"
   - Appointment status updated → `Completed`
   - Whiteboard PNG saved to patient record

6. **Screen: Consultation Complete** (`/consultation/:id/complete`)
   - Elements: "Prescription sent to [patient email]" confirmation, "Back to Dashboard" button

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| Email delivery failed | "Email failed. Download PDF instead." + download link | Doctor shares PDF manually; SendGrid retries delivery |
| Imaging analysis timeout | Spinner → timeout toast after 10s | "Retry Analysis" button; doctor can proceed without imaging result |
| Whiteboard fails to load | "Canvas unavailable. Please refresh." | Page refresh |

#### Exit Points
- **Success**: `/consultation/:id/complete` → back to Doctor Dashboard
- **Abandon (mid-consult)**: Confirmation modal: "Are you sure? Unsaved whiteboard changes will be lost."

---

### Flow 6: Family Health Profiles – Switching & Managing Members

**Goal**: Patient manages health profiles and appointments for multiple family members under one account.  
**Entry Point**: Patient Dashboard → Family Switcher dropdown  
**Frequency**: Recurring  
**Actor**: Patient (Priya managing Ramesh)

#### Happy Path

1. **Screen: Patient Dashboard** (`/dashboard`)
   - Elements: "Viewing as: [Name] ▼" dropdown at top (Family Switcher)
   - User Action: Clicks dropdown → avatar chips for each member appear

2. **User Action**: Selects a different family member (e.g., "Ramesh – Parent")
   - System: Updates `activePatient` global state (Zustand) → all dashboard context switches: appointments, prescriptions, health history, allergies

3. **User Action**: Clicks "Add Member" (+)
   - **Screen: Add Family Member Form** (`/family/add`)
   - Elements: Name, relationship dropdown, DOB, gender, known allergies (tag input), current medications, pre-existing conditions
   - Trigger: Submit → POST `/api/patients` (linked to account_id)

4. **Screen: Member Health Profile** (`/family/:patientId/profile`)
   - Elements: Conditions, current medications, past surgeries, known allergies – all editable
   - AI triage agent automatically receives the active patient's `health_info` as context for check-in

#### Exit Points
- **Success**: Dashboard context switches seamlessly to selected member
- **Cancel Add**: Returns to Dashboard

---

### Flow 7: ABHA Health ID – Create & Link Records

**Goal**: Patient creates their Ayushman Bharat Health Account (ABHA) ID and links national medical records.  
**Entry Point**: Patient Profile page → "Create ABHA ID" button  
**Frequency**: Once per patient  
**Actor**: Patient

#### Happy Path

1. **Screen: Patient Profile** (`/profile`)
   - User Action: Clicks "Create ABHA ID"

2. **Screen: ABHA Registration** (`/profile/abha/create`)
   - Elements: Aadhaar last-4-digits input OR mobile number input, "Generate OTP" button
   - System: POST to ABDM Sandbox or mock service if `ABHA_MODE=mock`

3. **Screen: OTP Verification** (`/profile/abha/verify`)
   - Elements: 6-digit OTP input (sandbox: auto-fill "123456"), "Verify" button
   - System: OTP verified → 14-digit ABHA number returned

4. **Screen: ABHA Card** (`/profile/abha/card`)
   - Elements: Blue-gradient ABHA card (official style), 14-digit ABHA number, QR code, "Link Medical Records" button, "Share via WhatsApp" button
   - System: `abha_id` stored in `patients` table

5. **User Action**: Clicks "Link Medical Records"
   - System: Fetches from ABDM Health Locker (mock: returns 2-3 pre-built records)
   - **Screen: Health Locker** (`/profile/abha/locker`)
   - Elements: List of records (date, facility name, type: Prescription / Lab Report / Discharge Summary), download links

#### Error States

| Error | Display | Recovery Action |
|---|---|---|
| OTP expired | "OTP has expired. Please request a new one." | "Resend OTP" button |
| ABDM sandbox down | "Health ID service is temporarily unavailable." | `ABHA_MODE=mock` fallback auto-engaged |

---

## 3. Navigation Map

### Patient Portal (`medbridge.vercel.app`)

```
/ (Landing)
├── /login
├── /register
│   └── /onboarding/profile
│       └── /onboarding/family
├── /dashboard  [Auth required]
│   ├── /book/voice
│   │   └── /booking/confirmation/:id
│   ├── /book/manual
│   │   └── /clinics/nearby  (if doctor unavailable)
│   ├── /checkin/:appointmentId
│   │   └── /checkin/:appointmentId/complete
│   ├── /family/add
│   ├── /family/:patientId/profile
│   └── /profile
│       ├── /profile/abha/create
│       ├── /profile/abha/verify
│       ├── /profile/abha/card
│       └── /profile/abha/locker
└── /prescriptions/:id/download  [Signed token, no full login required]
```

### Doctor Portal (`doctor.medbridge.vercel.app`)

```
/login
└── /dashboard  [Doctor JWT required]
    ├── /consultation/:appointmentId
    │   └── /consultation/:appointmentId/complete
    └── /appointments/:id  (deep-linked from email)
```

### Navigation Rules

| Rule | Detail |
|---|---|
| **Authentication Required** | All `/dashboard`, `/checkin`, `/consultation`, `/family`, `/profile` routes require valid JWT in memory |
| **Role-Based Access** | Doctor JWT cannot access Patient Portal routes and vice versa. Backend enforces role on all API routes. |
| **Redirect Logic** | Unauthenticated access to any protected route → redirect to `/login` with `returnUrl` param preserved |
| **Back Button Behaviour** | Voice check-in and consultation screens show a confirmation modal on back/navigate-away to prevent accidental abandonment |
| **PWA Deep Link Behaviour** | If PWA is opened from homescreen and JWT is expired → slide-up re-auth modal (does not lose screen context) |

---

## 4. Screen Inventory

### Patient Portal Screens

| Screen | Route | Access | Purpose | Key Actions |
|---|---|---|---|---|
| Landing Page | `/` | Public | Introduce MedBridge, drive registration/login | Register, Login |
| Register | `/register` | Public | Create new account | Submit form |
| Login | `/login` | Public | Authenticate existing user | Submit credentials |
| Onboarding – Profile | `/onboarding/profile` | Auth | Set DOB, gender | Save or Skip |
| Onboarding – Family | `/onboarding/family` | Auth | Add family members | Add, Skip |
| Patient Dashboard | `/dashboard` | Auth | View doctors, appointments, family switcher | Book, Check In, Switch Member |
| Voice Booking | `/book/voice` | Auth | Book appointment by voice | Speak, Cancel |
| Manual Booking | `/book/manual` | Auth | Book via form (fallback) | Select doctor/slot, Submit |
| Booking Confirmation | `/booking/confirmation/:id` | Auth | Confirm booking details | Start Check-In, Back |
| Voice Check-In | `/checkin/:appointmentId` | Auth | AI triage symptom collection | Speak, Skip |
| Check-In Complete | `/checkin/:id/complete` | Auth | Waiting room with Sukoon widget | Back to Dashboard |
| Add Family Member | `/family/add` | Auth | Add new member to account | Submit form |
| Member Profile | `/family/:patientId/profile` | Auth | View/edit member health info | Edit, Save |
| Patient Profile | `/profile` | Auth | Personal account settings, ABHA | Edit, Create ABHA |
| ABHA Create | `/profile/abha/create` | Auth | Enter Aadhaar/mobile for ABHA | Generate OTP |
| ABHA Verify | `/profile/abha/verify` | Auth | OTP entry | Verify OTP |
| ABHA Card | `/profile/abha/card` | Auth | View ABHA card + QR | Link Records, Share |
| Health Locker | `/profile/abha/locker` | Auth | View linked national records | Download |
| Prescription Download | `/prescriptions/:id/download` | Signed Token | Download prescription PDF | Download PDF |
| Nearby Clinics Map | `/clinics/nearby` | Auth | View nearest clinics if doctor unavailable | Book at clinic |

### Doctor Portal Screens

| Screen | Route | Access | Purpose | Key Actions |
|---|---|---|---|---|
| Doctor Login | `/login` | Public | Doctor authentication | Submit credentials |
| Doctor Dashboard | `/dashboard` | Doctor JWT | View patient queue, risk badges, summaries | Accept, Reschedule, Reject, Start Consultation |
| Active Consultation | `/consultation/:appointmentId` | Doctor JWT | Whiteboard, imaging, prescription | Draw, Upload Scan, Send Prescription |
| Consultation Complete | `/consultation/:id/complete` | Doctor JWT | Post-consultation confirmation | Back to Dashboard |

### Screen State Variants

| State | Implementation |
|---|---|
| **Loading** | Skeleton screens for data-heavy screens; spinner for action buttons |
| **Empty** | Illustrated empty state with contextual CTA |
| **Error** | Toast notification (non-blocking) for transient errors; inline error cards for persistent failures |
| **Success** | Animated checkmark + confirmation message; auto-dismiss or manual dismiss |
| **Offline** | Orange offline banner at top: "You're offline. Some features are unavailable." |

---

## 5. Interaction Patterns

### Pattern: Voice Input (Deepgram / Web Speech)

- **Activation**: Click mic button or page auto-activates on `/checkin` entry
- **Permission**: Browser permission dialog shown once on HTTPS; pre-granted on demo device
- **Active State**: Animated waveform, real-time transcript appearing word-by-word
- **Silence Detection**: 2-second silence → AI processes and responds
- **Fallback**: If Deepgram SDK fails → silently switch to Web Speech API; if both fail → show text input fallback
- **TTS Response**: `speechSynthesis.speak()` (browser-native) or ElevenLabs free tier

### Pattern: Form Submission

- **Validation**: Client-side instant validation (on blur) + server-side validation (on submit)
- **Loading State**: Submit button disabled + spinner icon while API call in progress
- **Success**: Redirect to confirmation screen OR inline success toast
- **Error**: Inline error messages below each field; form data preserved; scroll to first error

### Pattern: WebSocket Real-Time Update (Doctor Dashboard)

- **Connection**: Established on Doctor Dashboard mount (`ws://backend/ws/doctor/:doctorId`)
- **Events received**: `new_checkin`, `risk_update`, `appointment_accepted_confirm`
- **UI update**: New patient card animates in at the correct risk-sorted position; notification bell badge increments
- **Reconnect**: Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)

### Pattern: Risk Badge Display

- **HIGH** (score > 0.66): Red badge, red left-border on row, card at top of queue, pulse animation for 5 seconds
- **MEDIUM** (0.33–0.66): Orange badge, standard position
- **LOW** (< 0.33): Green badge, bottom of queue

### Pattern: Family Member Context Switch

- **Trigger**: User selects different member from "Viewing as:" dropdown
- **Transition**: 150ms fade on dashboard content panels
- **State Update**: `activePatient` updated in Zustand store → all data hooks re-fetch for new `patient_id`
- **Visual Indicator**: Selected member avatar has blue ring

### Pattern: Prescription PDF Delivery

- **Trigger**: Doctor clicks "Send Prescription" in prescription form modal
- **Loading State**: "Sending…" spinner on button
- **System**: PDFKit generates PDF → SendGrid sends email → webhook confirms delivery
- **Success**: "Prescription sent to [email]" toast + delivery timestamp
- **Fallback**: If email fails → "Email failed. Download PDF instead." with download link shown prominently

---

## 6. Decision Points

### Decision: Authentication & Role Routing

```
IF user is NOT authenticated
  THEN → redirect to /login (with returnUrl preserved)

ELSE IF user role = "patient"
  THEN → serve Patient Portal (medbridge.vercel.app)

ELSE IF user role = "doctor"
  THEN → serve Doctor Portal (doctor.medbridge.vercel.app)
```

### Decision: Voice Agent Mode Selection

```
IF intent detected = "book appointment" OR "schedule" OR "available slots"
  THEN → activate Scheduling Mode (Flow 2)

ELSE IF intent detected = "symptom" OR "check in" OR "I have [symptom]"
  THEN → activate Symptom Collection Mode (Flow 3)

ELSE IF low confidence on intent
  THEN → AI asks: "Are you looking to book an appointment or describe your symptoms?"
```

### Decision: STT Engine Selection

```
IF Deepgram SDK initialises successfully AND network latency < 500ms
  THEN → use Deepgram (primary)

ELSE
  THEN → silently fallback to Web Speech API (browser-native, zero latency)
  LOG: deepgram_fallback_triggered
```

### Decision: Risk Level Assignment

```
IF critical_flag = 1 (chest pain / difficulty breathing / loss of consciousness detected)
  THEN → risk_level = HIGH (override XGBoost score)

ELSE IF XGBoost_score > 0.66
  THEN → risk_level = HIGH

ELSE IF XGBoost_score between 0.33 and 0.66
  THEN → risk_level = MEDIUM

ELSE
  THEN → risk_level = LOW
```

### Decision: Email vs Download Fallback (Prescription)

```
IF SendGrid delivery confirmed within 60s
  THEN → show "Prescription sent" confirmation

ELSE IF SendGrid fails OR venue network blocks port 587
  THEN → switch to Nodemailer + Gmail SMTP (backup)

ELSE IF both email methods fail
  THEN → show prominent "Download PDF" button AND log failure
```

### Decision: ABHA Mode (Real vs Mock)

```
IF ENV ABHA_MODE = "sandbox"
  THEN → call live ABDM Sandbox API (sandbox.abdm.gov.in)

ELSE IF ENV ABHA_MODE = "mock"
  THEN → return hardcoded ABHA card + health records JSON from abha_mock_service.py
```

---

## 7. Error Handling Flows

### 404 Not Found
- **Display**: Custom 404 page with MedBridge branding
- **Elements**: "Page not found" message, "Back to Dashboard" CTA, MedBridge logo
- **Log**: 404 errors logged server-side for broken link detection

### 500 Server Error
- **Display**: "Something went wrong on our end. Please try again."
- **Elements**: Retry button, Support link
- **Fallback**: Mock JSON responses injectable via ENV flag (`USE_MOCK=true`) to keep demo live even if backend is down

### Network Offline
- **Detection**: `navigator.onLine` + Service Worker fetch interception
- **Display**: Orange offline banner at top of all screens
- **Behaviour**:
  - Booking: queue action for submission when online
  - Check-in voice: disabled; show "Requires internet connection"
  - Prescriptions: last received prescription served from Service Worker cache
- **Recovery**: Banner auto-dismisses when connection restored; queued actions execute

### Gemini API Rate Limit
- **Display**: "AI analysis is temporarily unavailable. Please try again in a moment."
- **Fallback**: Cache the exact demo API responses as JSON; inject mock response after 2 retries

### WebSocket Disconnect (Doctor Dashboard)
- **Display**: Yellow banner: "Live updates paused. Reconnecting…"
- **Behaviour**: Auto-reconnect with exponential backoff; manual "Refresh" button
- **Fallback**: Poll `/api/appointments?doctorId=X` every 10s if WebSocket cannot reconnect after 3 attempts

---

## 8. Responsive Behaviour

### Mobile-Specific Flows (PWA – Android/iOS)

| Screen | Mobile Layout Rules |
|---|---|
| **Patient Dashboard** | Single-column card layout. Horizontal scroll avatar chips for Family Switcher. Doctor cards as vertical scroll stacks. |
| **Voice Check-In / Booking** | Mic button full-width at bottom (min 64px height, thumb-reachable). Transcript font 18px+. Single interaction per screen. |
| **Doctor Dashboard Queue** | Table collapses to swipeable card stack. Risk badge prominent on card header. Accept/Reject buttons large at card bottom. |
| **Prescription Viewer** | Full-screen prescription card. Download PDF button prominent. WhatsApp share button to forward to pharmacy. |
| **ABHA Card** | Full-width card with large QR code. Scannable by clinic receptionist phone. WhatsApp share for ABHA number. |
| **Digital Whiteboard** | Force landscape orientation. Toolbar as floating action button. Fabric.js touch events handle finger/stylus drawing natively. |

### Desktop-Specific Flows

| Screen | Desktop Layout |
|---|---|
| **Patient Dashboard** | Two-column layout: doctor list left, appointment calendar right |
| **Doctor Dashboard** | Full sortable table with expanded inline summary panels. Multi-panel layout: queue + whiteboard side-by-side during consultation. |
| **Forms** | Multi-column layout for registration and prescription forms |

### Breakpoints (Tailwind)

- `sm` (640px): single-column patient flows
- `md` (768px): two-column dashboard layouts
- `lg` (1024px): full doctor dashboard with side panels
- `xl` (1280px): multi-panel consultation view

### Tap Target Requirements (Mobile Accessibility)

- All interactive elements: minimum `min-h-12 min-w-12` (48x48px)
- Mic button: minimum 64px height
- Risk badge Accept/Reject buttons: minimum 48px height, full card width on mobile

---

## 9. Animation & Transitions

### Page Transitions

| Transition | Effect | Duration |
|---|---|---|
| Page navigation | Fade in/out | 250ms |
| Modal open (Prescription form, Confirm dialogs) | Scale up from 95% + fade | 200ms |
| Drawer / slide panel (Imaging results, patient summary) | Slide from right | 250ms |
| Bottom sheet (Mobile: doctor actions) | Slide up from bottom | 200ms |

### Micro-interactions

| Interaction | Effect |
|---|---|
| Button click | Scale(0.95) tap feedback + Tailwind `active:` state |
| Form field focus | Border transitions from grey to MedBridge blue (#1A56A0) |
| Risk badge (HIGH) | Pulse animation for 5 seconds on new patient check-in arrival |
| Mic button (active) | Continuous waveform animation; ring pulse every 1.5s |
| Check-in success | Animated green checkmark (Lottie or CSS keyframes) |
| WebSocket new patient card | Slide-in from top of queue list (200ms ease-out) |
| Family member switch | Content panels fade out then fade in (150ms) |
| Prescription sent success | Checkmark + "Sent!" toast (300ms) |

---

## 10. PWA – Cross-Platform Installation & Offline Behaviour

### Installation Entry Points

| Platform | Install Method |
|---|---|
| Android Chrome | Auto install prompt banner (BeforeInstallPromptEvent) appears after 30s on dashboard |
| iOS Safari | Share button → "Add to Home Screen" (must use Safari, not Chrome on iOS) |
| Desktop Chrome/Edge | Install icon in browser address bar |

### Service Worker Cache Strategy

| Asset Type | Strategy |
|---|---|
| App shell (HTML, JS, CSS) | Cache-First (served instantly from cache) |
| API responses (appointments list, doctor list) | Network-First with 5s timeout fallback to cache |
| Last received prescription PDF | Cache on delivery; served offline |
| Voice STT (Deepgram) | Network-only (requires live connection) |

### Demo Day Two-Phone Setup

| Device | Configuration | Role |
|---|---|---|
| Phone 1 (Judge) | Patient Portal PWA installed, logged in as "Priya" | Patient: speaks to book + check in |
| Phone 2 (Teammate) | Doctor Portal PWA installed, logged in as "Dr. Arjun" | Doctor: sees live WebSocket update + risk badge |
| Laptop | Doctor Dashboard browser tab | Full dashboard view for judges to observe |

**Demo script**: Judge speaks on Phone 1 → summary appears on Phone 2 AND laptop simultaneously via WebSocket. No App Store. No download. Installed in 3 seconds from URL.

---

## 11. Security & Authentication Flow

### JWT Authentication

- On login → JWT issued (24h expiry), stored in **memory only** (not localStorage, not cookies)
- All FastAPI routes require `Authorization: Bearer <token>` header
- Role encoded in JWT payload: `{ "sub": userId, "role": "patient" | "doctor" }`
- Token refresh: re-authenticate via `/api/auth/refresh` using a short-lived HTTP-only cookie refresh token

### Data Privacy Rules

| Rule | Implementation |
|---|---|
| No PII in URL query params | All health data sent via POST body |
| No API keys in source code | All secrets in `.env` files; `.gitignore` enforced; `.env.example` documented |
| HTTPS enforced | Vercel + Render provide HTTPS by default; no HTTP fallback |
| Patient data excluded from server logs | FastAPI middleware strips patient health fields from access logs |

---

## 12. AI Copilot Flow (Bonus Feature)

**Goal**: Doctor uses natural language commands to navigate the dashboard autonomously via page-agent.  
**Entry Point**: Doctor Dashboard → "Enable AI Copilot" toggle in header  
**Dependency**: Bonus feature – implement only after all P0/P1 features are complete

### Interaction Examples

| Doctor Command | page-agent Action |
|---|---|
| "Show glucose trends for this patient" | Auto-navigates to Labs tab, scrolls to glucose chart |
| "Book lab test for this patient" | Auto-fills lab booking form fields |
| "Show all HIGH risk patients today" | Applies risk filter to appointment table |

### Implementation Note
- `<script>` tag with `page-agent.js` injected in Doctor Dashboard
- 100% client-side – no cloud dependency, no browser extension required
- Disable strict CSP for doctor portal during demo if CSP conflict arises
- If unstable → toggle off; core 8 requirements are unaffected

---

## 13. Complete Flow Coverage Matrix

| PDF Requirement | Flow # | Route(s) | Status |
|---|---|---|---|
| Patient Dashboard (view doctors & schedule) | Flow 1, 2 | `/dashboard`, `/book/voice`, `/book/manual` | Covered |
| Voice AI Agent (scheduling + symptom collection) | Flow 2, 3 | `/book/voice`, `/checkin/:id` | Covered |
| Speech-to-Text + AI Summary (Gemini / LangGraph) | Flow 3 | `/checkin/:id` | Covered |
| Send summary to doctor pre-consultation (WebSocket) | Flow 3 | Backend → Doctor Dashboard | Covered |
| Doctor Dashboard (manage appointments) | Flow 4 | `/dashboard` (doctor portal) | Covered |
| ML Risk Prioritization (XGBoost badges + Accept/Reject) | Flow 4 | `/dashboard` (doctor portal) | Covered |
| Digital Whiteboard (Fabric.js) | Flow 5 | `/consultation/:id` | Covered |
| Digital Prescription via Gmail (PDF + SendGrid) | Flow 5 | `/consultation/:id` → email | Covered |
| [BONUS] AI GUI Copilot | Section 12 | `/dashboard` (doctor portal) | Documented |
| [MVP+] Family Health Profiles | Flow 6 | `/dashboard`, `/family/*` | Covered |
| [MVP+] ABHA Health ID Integration | Flow 7 | `/profile/abha/*` | Covered |
| PWA – Cross-platform mobile install | Section 10 | All routes | Covered |
| Medical Imaging Analysis (Gemini) | Section 16 | `/consultation/:id` | Covered |
| Emergency Resource Coordination | Section 14 | Auto-trigger | Covered |
| Nearby Clinics Map | Section 15 | `/clinics/nearby` | Covered |

---

## 14. Emergency Resource Coordination (Bonus Feature)

**Goal**: When AI detects critical symptoms, automatically find nearest emergency resources.  
**Entry Point**: Automatic trigger when XGBoost returns HIGH risk with critical_flags  
**PDF Alignment**: Social Impact + Critical Problem Solving  
**Actor**: System-triggered (no user action required)

### Happy Path

1. **System Trigger**: XGBoost risk engine returns `risk_level: HIGH` AND `critical_flag: 1`
   - Critical symptoms: "chest pain", "stroke", "difficulty breathing", "loss of consciousness"

2. **System Action**: Backend calls emergency resource service
   ```python
   # backend/emergency_service.py
   CRITICAL_SYMPTOMS = ["chest pain", "stroke", "difficulty breathing", "loss of consciousness"]
   
   def find_nearest_emergency(resource_type: str, location: dict) -> list:
       # Poll MedBridge Network for nearest available specialist/equipment
       return [{ 
           "facility_name": "City Hospital Emergency",
           "distance_km": 2.5,
           "availability": "Available Now",
           "contact": "+91-XXX-XXXX"
       }]
   ```

3. **Doctor Dashboard Alert**:
   - Red pulsing banner: "⚠️ CRITICAL CASE DETECTED"
   - Auto-popup: List of nearest emergency facilities with distance and contact
   - "Call Emergency" button for each facility

4. **Patient Notification** (optional):
   - SMS/WhatsApp sent to emergency contact: "Your location shared with nearest emergency services"

### Error States

| Error | Display | Recovery Action |
|---|---|---|
| No emergency facilities found | "No nearby facilities found. Call 102/104 directly." | Show national emergency numbers |
| Network timeout | Silent fail; doctor continues normal consultation | Log for analysis |

---

## 15. Nearby Clinics Map (Optional Feature)

**Goal**: Show nearest clinics if patient's preferred doctor is unavailable.  
**Entry Point**: Doctor unavailable → "View Nearby Clinics" button  
**Priority**: P3 OPTIONAL  
**Actor**: Patient

### Happy Path

1. **Screen: No Slots Available** (in Flow 2)
   - User Action: Doctor has no slots
   - AI Response: "Dr. Sharma has no availability. Would you like to see nearby clinics?"

2. **User Action**: Clicks "View Nearby Clinics"
   - **Screen: Nearby Clinics Map** (`/clinics/nearby`)
   - Elements: Leaflet.js map, clinic pins, distance from patient
   - Uses: Browser Geolocation API for patient location
   - Data Source: `medical_centers.json` from imonishkumar/Symptom-Checker-Chatbot

3. **User Action**: Clicks a clinic pin
   - Shows: Clinic name, address, distance, available doctors, "Book Here" button

### Implementation

```tsx
// frontend/src/components/NearbyClinicsMap.tsx
import L from 'leaflet'
import medicalCenters from '../data/medical_centers.json'

// Render map with clinic pins, click → show name + distance
// Uses browser Geolocation API for patient's current position
```

---

## 16. Medical Imaging Analysis Flow

**Goal**: Doctor uploads medical scan (X-ray/MRI/CT) and gets Gemini AI analysis.  
**Entry Point**: Active Consultation → "Upload Medical Scan" drag-drop zone  
**PDF Alignment**: Technical Complexity + Innovation  
**Actor**: Doctor

### Happy Path

1. **Screen: Active Consultation** (`/consultation/:appointmentId`)
   - Elements: Drag-and-drop zone labeled "Upload Medical Scan"
   - User Action: Drops X-ray/MRI/CT image

2. **System Action**: 
   - POST `/api/imaging/analyze` with base64 image
   - Gemini 2.0 Flash multimodal analysis

3. **Screen: Imaging Panel** (slide-in panel)
   - Elements: Uploaded image preview, AI analysis results
   ```json
   {
     "image_type": "Chest X-Ray",
     "region": "Thorax",
     "abnormalities": ["mild opacity in left lower lobe"],
     "quality_score": 0.9,
     "confidence": 0.85
   }
   ```

4. **Doctor Action**: Reviews AI analysis, draws on whiteboard, continues consultation

### Error States

| Error | Display | Recovery Action |
|---|---|---|
| Gemini analysis timeout | "Analysis timed out. Retry?" | Retry button; proceed without |
| Invalid image format | "Please upload X-ray, MRI, or CT scan." | Retry with valid format |

---

*MedBridge – APP_FLOW.md v1.1 | Hawkathon 2026 Track 3: Healthcare*  
*Built to win. Designed to heal.*
