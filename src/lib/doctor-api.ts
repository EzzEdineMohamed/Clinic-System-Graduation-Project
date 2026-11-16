// =====================================================================
// الـ Endpoints بتاعة موديول الدكتور، ولينك الروشتة بتاع المريض.
// كلهم بتوكن صاحبهم، والصلاحيات في الداتابيز و Storage.
// =====================================================================

import { ApiError, request } from "@/lib/api";
import type {
  DoctorActionResult,
  DoctorVisit,
  SignedUrlResult,
} from "@/types/doctor";

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const VISIT_COLUMNS =
  "id,appointment_date,start_time,end_time,status,source,guest_name,guest_phone,diagnosis,prescription_path," +
  "patient:patients(full_name,phone,gender,date_of_birth,chronic_disease)";

/** أنواع الروشتة المسموحة، نفس إعدادات الـ bucket */
export const PRESCRIPTION_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
export const PRESCRIPTION_MAX_BYTES = 5 * 1024 * 1024; // 5 ميجا

export const doctorApi = {
  /** D1: GET مرضى يوم معين. الـ RLS بترجّع حجوزات الدكتور ده بس */
  dayVisits: (token: string, date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new ApiError(400, "bad_date", "التاريخ مش صحيح");
    return request<DoctorVisit[]>(
      `/rest/v1/appointments?select=${VISIT_COLUMNS}&appointment_date=eq.${date}&status=neq.cancelled&order=start_time`,
      { method: "GET", token },
    );
  },

  /** D2: POST تأكيد الحضور */
  markAttended: (token: string, appointmentId: string) =>
    request<DoctorActionResult>("/rest/v1/rpc/mark_attended", {
      token,
      body: { p_appointment_id: appointmentId },
    }),

  /**
   * D3: POST رفع الروشتة على Storage، وبيرجّع المسار اللي يتبعت لـ record_visit.
   * مش بنستخدم request() هنا، لأن الـ body ملف مش JSON.
   */
  uploadPrescription: async (
    token: string,
    doctorId: string,
    appointmentId: string,
    file: File,
  ) => {
    const ext = PRESCRIPTION_TYPES[file.type];
    if (!ext)
      throw new ApiError(
        400,
        "bad_type",
        "الروشتة لازم تكون PDF أو صورة JPG أو PNG",
      );
    if (file.size > PRESCRIPTION_MAX_BYTES)
      throw new ApiError(400, "too_big", "حجم الروشتة أكبر من 5 ميجا");

    const path = `${doctorId}/${appointmentId}.${ext}`;
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/storage/v1/object/prescriptions/${path}`, {
        method: "POST",
        headers: {
          apikey: PUBLIC_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type,
          "x-upsert": "true", // لو رفع تاني لنفس الحجز، الجديد مكان القديم
        },
        body: file,
      });
    } catch {
      throw new ApiError(0, "network", "مش قادر أوصل للسيرفر. اتأكد من النت.");
    }
    if (!res.ok) {
      // الـ policy بترفض: الحجز مش بتاعه، أو مش attended، أو المريض ملوش حساب
      throw new ApiError(
        res.status,
        "upload_failed",
        "مقدرناش نرفع الروشتة. اتأكد إن الحضور متأكد وإن المريض عنده حساب.",
      );
    }
    return path; // نفس الجزء اللي بعد prescriptions/ في الـ Key اللي راجع
  },

  /** D4: POST حفظ التشخيص، ومعاه مسار الروشتة لو اترفعت */
  recordVisit: (
    token: string,
    appointmentId: string,
    diagnosis: string,
    prescriptionPath?: string,
  ) =>
    request<DoctorActionResult>("/rest/v1/rpc/record_visit", {
      token,
      body: {
        p_appointment_id: appointmentId,
        p_diagnosis: diagnosis,
        ...(prescriptionPath ? { p_prescription_path: prescriptionPath } : {}),
      },
    }),

  /** D5: POST لينك مؤقت للروشتة (5 دقايق). المريض صاحب الحجز أو الدكتور بس */
  prescriptionUrl: async (token: string, path: string) => {
    const { signedURL } = await request<SignedUrlResult>(
      `/storage/v1/object/sign/prescriptions/${path}`,
      {
        token,
        body: { expiresIn: 300 },
      },
    );
    return `${BASE_URL}/storage/v1${signedURL}`;
  },
};

/** الرسالة اللي تظهر لأي غلط في موديول الدكتور */
export function doctorErrorMessage(
  err: unknown,
  fallback: (e: unknown) => string,
): string {
  if (err instanceof ApiError) {
    // P0001 و 42501 رسايلنا بالعربي من الداتابيز، والباقي رسايل الرفع
    if (
      [
        "P0001",
        "42501",
        "upload_failed",
        "bad_type",
        "too_big",
        "network",
      ].includes(err.code)
    )
      return err.message;
    if (err.status === 400 || err.status === 404) return "الروشتة مش موجودة";
  }
  return fallback(err);
}

/** اسم صاحب الحجز، سواء عنده حساب أو لأ */
export function visitPerson(v: DoctorVisit) {
  return {
    name: v.patient?.full_name ?? v.guest_name ?? "—",
    phone: v.patient?.phone ?? v.guest_phone ?? "",
    hasAccount: v.patient !== null,
  };
}
