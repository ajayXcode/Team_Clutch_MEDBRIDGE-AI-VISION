import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import RxScanner from "./pages/RxScanner";
import NotFound from "./pages/NotFound";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientRegister from "./pages/patient/PatientRegister";
import Onboarding from "./pages/patient/Onboarding";
import PatientDashboard from "./pages/patient/PatientDashboard";
import VoiceBooking from "./pages/patient/VoiceBooking";
import ManualBooking from "./pages/patient/ManualBooking";
import BookingConfirmation from "./pages/patient/BookingConfirmation";
import VoiceCheckIn from "./pages/patient/VoiceCheckIn";
import CheckInComplete from "./pages/patient/CheckInComplete";
import FamilyAdd from "./pages/patient/FamilyAdd";
import FamilyProfile from "./pages/patient/FamilyProfile";
import PatientProfile from "./pages/patient/PatientProfile";
import AbhaCreate from "./pages/patient/AbhaCreate";
import AbhaCard from "./pages/patient/AbhaCard";
import AbhaLocker from "./pages/patient/AbhaLocker";
import NearbyClinics from "./pages/patient/NearbyClinics";
import PrescriptionDownload from "./pages/patient/PrescriptionDownload";
import MedicineInventory from "./pages/patient/MedicineInventory";
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import ActiveConsultation from "./pages/doctor/ActiveConsultation";
import ConsultationComplete from "./pages/doctor/ConsultationComplete";
import Whiteboard from "./pages/doctor/Whiteboard";
import ImagingAnalysis from "./pages/doctor/ImagingAnalysis";
import ReportAnalysis from "./pages/doctor/ReportAnalysis";
import DemoBackground from "./pages/DemoBackground";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

export const router = createBrowserRouter([
  // Public
  { path: "/", Component: Landing },
  { path: "/rx-scanner", Component: RxScanner },
  { path: "/demo-background", Component: DemoBackground },
  { path: "/privacy", Component: PrivacyPolicy },
  { path: "/terms", Component: TermsConditions },

  // Patient Auth
  { path: "/patient/login", Component: PatientLogin },
  { path: "/patient/register", Component: PatientRegister },
  { path: "/patient/onboarding", Component: Onboarding },

  // Patient App (auth required — enforced inside each component)
  { path: "/patient/dashboard", Component: PatientDashboard },
  { path: "/book/voice", Component: VoiceBooking },
  { path: "/book/manual", Component: ManualBooking },
  { path: "/booking/confirmation/:id", Component: BookingConfirmation },
  { path: "/checkin/:appointmentId", Component: VoiceCheckIn },
  { path: "/checkin/:appointmentId/complete", Component: CheckInComplete },
  { path: "/family/add", Component: FamilyAdd },
  { path: "/family/:patientId/profile", Component: FamilyProfile },
  { path: "/profile", Component: PatientProfile },
  { path: "/profile/abha/create", Component: AbhaCreate },
  { path: "/profile/abha/card", Component: AbhaCard },
  { path: "/profile/abha/locker", Component: AbhaLocker },       // ← NEW: ABDM Health Locker
  { path: "/clinics/nearby", Component: NearbyClinics },          // ← NEW: Nearby Clinics Map
  { path: "/prescriptions/:id/download", Component: PrescriptionDownload }, // ← NEW: Prescription Download
  { path: "/inventory", Component: MedicineInventory },          // ← NEW: Medicine Inventory

  // Doctor Portal
  { path: "/doctor/login", Component: DoctorLogin },
  { path: "/doctor/dashboard", Component: DoctorDashboard },
  { path: "/consultation/:appointmentId", Component: ActiveConsultation },
  { path: "/consultation/:appointmentId/whiteboard", Component: Whiteboard },
  { path: "/consultation/:appointmentId/complete", Component: ConsultationComplete },
  { path: "/doctor/imaging", Component: ImagingAnalysis },
  { path: "/doctor/reports", Component: ReportAnalysis },

  // 404 — proper branded page
  { path: "*", Component: NotFound },
]);
