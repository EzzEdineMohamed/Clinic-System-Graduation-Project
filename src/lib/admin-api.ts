// =====================================================================
// الـ Endpoints بتاعة لوحة الأدمن.
// كل function هنا = endpoint واحد، وكلهم محتاجين توكن الأدمن.
// الصلاحيات نفسها في الداتابيز (RLS + require_admin)، فلو حد غير
// الأدمن نادى أي واحدة منهم، Supabase هيرفض.
// =====================================================================

import { ApiError, request } from "@/lib/api";
import type {
  CreateStaffInput,
  CreateStaffResponse,
  DoctorRow,
  SaveDoctorInput,
  SetPasswordResponse,
  StaffMember,
  StaffRole,
  StaffUpdate,
} from "@/types/admin";
import { PatientRow } from "./validation/auth";

// الأعمدة اللي محتاجينها من profiles، بدل ما نجيب كله
const STAFF_COLUMNS = "id,email,role,full_name,phone,is_active,created_at";
const DOCTOR_COLUMNS =
  "doctors(specialty,consultation_fee,clinic_share_percent,slot_minutes," +
  "doctor_schedules(day_of_week,start_time,end_time))";

export const adminApi = {
  /** GET /rest/v1/profiles?role=eq.nurse: كل الممرضين، الأحدث الأول */
  listStaff: (token: string, role: StaffRole) =>
    request<StaffMember[]>(
      `/rest/v1/profiles?select=${STAFF_COLUMNS}&role=eq.${role}&order=created_at.desc`,
      { method: "GET", token },
    ),

  /** GET: كل الدكاترة، ومع كل دكتور تخصصه وسعره ومواعيده في نفس الـ request */
  listDoctors: async (token: string) => {
    const rows = await request<DoctorRow[]>(
      `/rest/v1/profiles?select=${STAFF_COLUMNS},${DOCTOR_COLUMNS}&role=eq.doctor&order=created_at.desc`,
      { method: "GET", token },
    );
    // نرتب أيام كل دكتور من الحد للسبت
    rows.forEach((d) =>
      d.doctors?.doctor_schedules.sort((a, b) => a.day_of_week - b.day_of_week),
    );
    return rows;
  },

  /** POST /functions/v1/create-staff: حساب دكتور أو ممرضة جديد */
  createStaff: (token: string, input: CreateStaffInput) =>
    request<CreateStaffResponse>("/functions/v1/create-staff", {
      token,

      body: input,
    }),

  /** PATCH /rest/v1/profiles?id=eq.<id>: تعديل الاسم أو الرقم، أو إيقاف وتفعيل */
  updateStaff: async (token: string, id: string, changes: StaffUpdate) => {
    const rows = await request<StaffMember[]>(
      `/rest/v1/profiles?id=eq.${id}&select=${STAFF_COLUMNS}`,
      {
        method: "PATCH",
        token,
        body: changes,
        headers: { Prefer: "return=representation" },
      },
    );
    // لو الـ RLS منع التعديل، Supabase مش بيرجع error، بيرجع لستة فاضية
    if (rows.length === 0)
      throw new ApiError(403, "forbidden", "مش مسموحلك تعدّل الحساب ده");
    return rows[0];
  },

  /** GET /rest/v1/patients: كل المرضى، الأحدث الأول، وممكن بحث بالاسم أو الموبايل */
  listPatients: (token: string, search?: string) => {
    const columns =
      "id,profile_id,full_name,phone,gender,date_of_birth,chronic_disease,created_at,appointments(count)";
    let path = `/rest/v1/patients?select=${columns}&order=created_at.desc&limit=200`;

    // نشيل أي رمز غير الحروف والأرقام والمسافات، علشان ميبوّظش صيغة الـ or
    const q = search?.replace(/[^\p{L}\p{N} ]/gu, "").trim();
    if (q)
      path += `&or=(full_name.ilike.*${encodeURIComponent(q)}*,phone.like.*${encodeURIComponent(q)}*)`;

    return request<PatientRow[]>(path, { method: "GET", token });
  },

  /** POST /functions/v1/set-staff-password: باسوورد جديد لدكتور أو ممرضة */
  setStaffPassword: (token: string, userId: string, password: string) =>
    request<SetPasswordResponse>("/functions/v1/set-staff-password", {
      token,
      body: { user_id: userId, password },
    }),

  /** POST /rest/v1/rpc/admin_save_doctor: بيانات الدكتور ومواعيده مرة واحدة */
  saveDoctor: (token: string, input: SaveDoctorInput) =>
    request<null>("/rest/v1/rpc/admin_save_doctor", { token, body: input }),
};
