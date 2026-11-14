// =====================================================================
// Types & Interfaces بتاعة حجز الكشف (موديول المريض).
// شكل البيانات بس، ومفيهوش أي كود بيشتغل.
// =====================================================================

import type { ScheduleDay } from "@/types/admin";

// ---------- اللي بيرجع من الباك أند ------------------------------------

/** دكتور في لستة "احجز كشف" (P1) */
export interface BookableDoctor {
  id: string;
  full_name: string;
  doctors: {
    specialty: string;
    consultation_fee: number;
    slot_minutes: number;
    doctor_schedules: ScheduleDay[];
  };
}

/** ميعاد فاضي من get_available_slots (P2) */
export interface Slot {
  start_time: string; // "19:00:00"
  end_time: string; // "19:20:00"
}

/** رد book_appointment لما ينجح (P3) */
export interface BookResult {
  appointment_id: string;
  amount: number;
  reference: string; // "TEST-EA0D39FB48-4242"
}

/** حالة الحجز، نفس الـ enum اللي في الداتابيز */
export type AppointmentStatus = "booked" | "attended" | "cancelled";

/** حجز في "سجل حجوزاتي" (P4) */
export interface MyAppointment {
  id: string;
  appointment_date: string; // "2026-11-17"
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: "online" | "clinic";
  fee: number;
  diagnosis: string | null;
  prescription_path: string | null;
  created_at: string;
  doctor: { specialty: string; profile: { full_name: string } };
  payment: {
    method: "card" | "cash";
    status: "pending" | "paid" | "failed" | "refunded";
    gateway_reference: string | null;
    paid_at: string | null;
  } | null;
}

// ---------- اللي بنبعته للباك أند --------------------------------------

/** الـ body بتاع POST /rest/v1/rpc/book_appointment (للمريض) */
export interface BookInput {
  p_doctor_id: string;
  p_date: string; // "2026-11-17"
  p_start_time: string; // "19:00"
  p_card_number: string;
}
