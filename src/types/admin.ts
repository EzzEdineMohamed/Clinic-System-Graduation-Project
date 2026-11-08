// =====================================================================
// Types & Interfaces بتاعة لوحة الأدمن.
// شكل البيانات بس، ومفيهوش أي كود بيشتغل.
// =====================================================================

import { Role } from "./auth";

// ---------- Types ------------------------------------------------------

/** الموظفين اللي الأدمن بيعملهم: دكتور أو ممرضة بس */
export type StaffRole = Extract<Role, "doctor" | "nurse">;

// ---------- اللي بيرجع من الباك أند ------------------------------------

/** موظف زي ما هو في جدول profiles */
export interface StaffMember {
  id: string;
  email: string;
  role: StaffRole;
  full_name: string;
  phone: string;
  is_active: boolean;
  created_at: string; // تاريخ ووقت بصيغة ISO
}

/** يوم شغل واحد للدكتور (سطر في doctor_schedules) */
export interface ScheduleDay {
  day_of_week: number; // 0 الحد ... 6 السبت
  start_time: string; // "19:00"
  end_time: string; // "22:00"
}

/** البيانات المهنية للدكتور (سطر في doctors) */
export interface DoctorInfo {
  specialty: string;
  consultation_fee: number;
  clinic_share_percent: number;
  slot_minutes: number;
  doctor_schedules: ScheduleDay[];
}

/** دكتور كامل: حسابه + بياناته المهنية (null لو لسه متسجلتش) */
export interface DoctorRow extends StaffMember {
  doctors: DoctorInfo | null;
}

// ---------- اللي بنبعته للباك أند --------------------------------------

/** الـ body بتاع POST /functions/v1/create-staff */
export interface CreateStaffInput {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: StaffRole;
}

/** رد create-staff لما ينجح (201) */
export interface CreateStaffResponse {
  id: string;
  email: string;
  role: StaffRole;
}

/** الـ body بتاع POST /rest/v1/rpc/admin_save_doctor */
export interface SaveDoctorInput {
  p_doctor_id: string;
  p_specialty: string;
  p_consultation_fee: number;
  p_clinic_share_percent: number;
  p_slot_minutes: number;
  p_schedule: ScheduleDay[];
}

/** اللي الأدمن يقدر يعدّله في حساب موظف (PATCH على profiles) */
export type StaffUpdate = Partial<
  Pick<StaffMember, "full_name" | "phone" | "is_active">
>;

/** رد set-staff-password لما ينجح */
export interface SetPasswordResponse {
  ok: true;
  code: "password_changed";
  message: string;
  user_id: string;
}
