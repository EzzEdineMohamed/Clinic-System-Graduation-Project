// =====================================================================
// الـ Endpoints بتاعة حجز الكشف (موديول المريض).
// كلهم محتاجين توكن المريض، والصلاحيات في الداتابيز (RLS + الدوال).
// =====================================================================

import { request } from "@/lib/api";
import type {
  BookInput,
  BookResult,
  BookableDoctor,
  MyAppointment,
  Slot,
} from "@/types/booking";

const DOCTOR_COLUMNS =
  "id,full_name,doctors!inner(specialty,consultation_fee,slot_minutes," +
  "doctor_schedules(day_of_week,start_time,end_time))";

const APPOINTMENT_COLUMNS =
  "id,appointment_date,start_time,end_time,status,source,fee,diagnosis,prescription_path,created_at," +
  "doctor:doctors(specialty,profile:profiles(full_name))," +
  "payment:payments(method,status,gateway_reference,paid_at)";

export const bookingApi = {
  /** P1: GET الدكاترة اللي ينفع يتحجز معاهم (شغالين وبياناتهم كاملة) */
  listDoctors: async (token: string) => {
    const rows = await request<BookableDoctor[]>(
      `/rest/v1/profiles?select=${DOCTOR_COLUMNS}&role=eq.doctor&is_active=eq.true&order=full_name`,
      { method: "GET", token },
    );
    // نرتب أيام كل دكتور من الحد للسبت
    rows.forEach((d) =>
      d.doctors.doctor_schedules.sort((a, b) => a.day_of_week - b.day_of_week),
    );
    return rows;
  },

  /** P2: POST المواعيد الفاضية لدكتور في يوم */
  getSlots: (token: string, doctorId: string, date: string) =>
    request<Slot[]>("/rest/v1/rpc/get_available_slots", {
      token,
      body: { p_doctor_id: doctorId, p_date: date },
    }),

  /** P3: POST الحجز والدفع مع بعض. الدالة بترجع لستة فيها صف واحد */
  book: async (token: string, input: BookInput) => {
    const rows = await request<BookResult[]>("/rest/v1/rpc/book_appointment", {
      token,
      body: input,
    });
    return rows[0];
  },

  /** P4: GET حجوزاتي. مفيش فلتر بالمريض لأن الـ RLS بيرجّع حجوزاته هو بس */
  myAppointments: (token: string) =>
    request<MyAppointment[]>(
      `/rest/v1/appointments?select=${APPOINTMENT_COLUMNS}&order=appointment_date.desc,start_time.desc`,
      { method: "GET", token },
    ),
};
