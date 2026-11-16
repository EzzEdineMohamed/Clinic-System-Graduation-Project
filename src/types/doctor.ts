// =====================================================================
// Types & Interfaces بتاعة موديول الدكتور.
// شكل البيانات بس، ومفيهوش أي كود بيشتغل.
// =====================================================================

import type { Gender } from "@/types/auth";
import type { AppointmentStatus } from "@/types/booking";

// ---------- اللي بيرجع من الباك أند ------------------------------------

/** حجز في لستة مرضى النهارده (D1) */
export interface DoctorVisit {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: "online" | "clinic";
  guest_name: string | null; // مريض ملوش حساب
  guest_phone: string | null;
  diagnosis: string | null;
  prescription_path: string | null;
  patient: {
    full_name: string;
    phone: string;
    gender: Gender | null;
    date_of_birth: string | null;
    chronic_disease: string | null;
  } | null; // مريض عنده حساب
}

/** رد mark_attended (D2) و record_visit (D4) لما ينجحوا */
export interface DoctorActionResult {
  ok: true;
  code: "attendance_confirmed" | "visit_recorded";
  message: string;
  appointment_id: string;
  prescription_path?: string | null;
}

/** رد طلب اللينك المؤقت (D5) */
export interface SignedUrlResult {
  signedURL: string; // "/object/sign/prescriptions/...?token=..."
}
