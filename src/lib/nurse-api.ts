// =====================================================================
// الـ Endpoints بتاعة موديول الممرضة.
// كلهم محتاجين توكن الممرضة (أو الأدمن)، والصلاحيات في الداتابيز.
// الدكاترة والمواعيد الفاضية بنستخدم فيهم bookingApi بتاع المريض زي ما هو.
// =====================================================================

import { ApiError, request } from "@/lib/api";
import type { BookResult } from "@/types/booking";
import type {
  CancelResult,
  ClinicBookInput,
  DayBooking,
  PatientMatch,
} from "@/types/nurse";

const DAY_COLUMNS =
  "id,appointment_date,start_time,end_time,status,source,fee,guest_name,guest_phone," +
  "patient:patients(full_name,phone)," +
  "doctor:doctors(specialty,profile:profiles(full_name))," +
  "payment:payments(method,status)";

/** اسم ورقم صاحب الحجز، سواء عنده ملف أو لأ */
export function bookingPerson(b: DayBooking) {
  return {
    name: b.patient?.full_name ?? b.guest_name ?? "—",
    phone: b.patient?.phone ?? b.guest_phone ?? "",
    hasFile: b.patient !== null,
  };
}

export const nurseApi = {
  /** N1: GET مريض عنده ملف برقم موبايله بالظبط (null لو مش موجود) */
  findPatientByPhone: async (token: string, phone: string) => {
    const digits = phone.replace(/\D/g, ""); // أرقام بس، علشان ميبوّظش الـ URL
    const rows = await request<PatientMatch[]>(
      `/rest/v1/patients?select=id,full_name,phone,profile_id&phone=eq.${digits}`,
      { method: "GET", token },
    );
    return rows[0] ?? null;
  },

  /** N4: GET حجوزات يوم معين، وممكن لدكتور واحد بس */
  dayBookings: (token: string, date: string, doctorId?: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new ApiError(400, "bad_date", "التاريخ مش صحيح");
    let path = `/rest/v1/appointments?select=${DAY_COLUMNS}&appointment_date=eq.${date}&order=start_time`;
    if (doctorId) path += `&doctor_id=eq.${encodeURIComponent(doctorId)}`;
    return request<DayBooking[]>(path, { method: "GET", token });
  },

  /** N3: POST الحجز من العيادة، كاش أو فيزا. الدالة بترجع لستة فيها صف واحد */
  book: async (token: string, input: ClinicBookInput) => {
    const rows = await request<BookResult[]>("/rest/v1/rpc/book_appointment", {
      token,
      body: input,
    });
    return rows[0];
  },

  /** N5: POST إلغاء الحجز، وبيرجع رسالة النجاح والمبلغ اللي يرجع */
  cancel: (token: string, appointmentId: string) =>
    request<CancelResult>("/rest/v1/rpc/cancel_appointment", {
      token,
      body: { p_appointment_id: appointmentId },
    }),
};
