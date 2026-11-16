// =====================================================================
// Types & Interfaces بتاعة موديول الممرضة (الاستقبال).
// شكل البيانات بس، ومفيهوش أي كود بيشتغل.
// =====================================================================

import type { AppointmentStatus } from "@/types/booking";

// ---------- اللي بيرجع من الباك أند ------------------------------------

/** مريض عنده ملف، لقيناه برقمه (N1) */
export interface PatientMatch {
  id: string;
  full_name: string;
  phone: string;
  profile_id: string | null;
}

/** حجز في لستة حجوزات اليوم (N4) */
export interface DayBooking {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: "online" | "clinic";
  fee: number;
  guest_name: string | null; // مريض ملوش ملف
  guest_phone: string | null;
  patient: { full_name: string; phone: string } | null; // مريض عنده ملف
  doctor: { specialty: string; profile: { full_name: string } };
  payment: {
    method: "card" | "cash";
    status: "pending" | "paid" | "failed" | "refunded";
  } | null;
}

/** رد cancel_appointment لما ينجح (N5) */
export interface CancelResult {
  ok: true;
  code: "appointment_cancelled";
  message: string;
  appointment_id: string;
  refund_amount: number;
}

// ---------- اللي بنبعته للباك أند --------------------------------------

type ClinicBookBase = {
  p_doctor_id: string;
  p_date: string; // "2026-11-18"
  p_start_time: string; // "10:00"
  p_method: "cash" | "card";
};

/** الـ body بتاع book_appointment من العيادة: يا مريض عنده ملف، يا الاسم والرقم */
export type ClinicBookInput =
  | (ClinicBookBase & { p_patient_id: string })
  | (ClinicBookBase & { p_guest_name: string; p_guest_phone: string });
