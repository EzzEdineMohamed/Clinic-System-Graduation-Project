// =====================================================================
// Types & Interfaces بتاعة الـ Authentication.
// الملف ده فيه "شكل" البيانات بس، ومفيهوش أي كود بيشتغل.
// بيختفي كله بعد الـ build، ووظيفته إن TypeScript ينبهك وانت بتكتب.
// =====================================================================

// ---------- Types: قيم محددة (union) ----------------------------------

/** الأدوار الأربعة. أي قيمة غيرهم TypeScript هيرفضها */
export type Role = "patient" | "nurse" | "doctor" | "admin";

/** النوع */
export type Gender = "male" | "female";

// ---------- Interfaces: شكل الـ objects اللي بترجع من الباك أند -------

/** اليوزر زي ما Supabase Auth بيرجعه */
export interface AuthUser {
  id: string;
  email: string;
  identities?: unknown[];
}

/** رد الـ signup والـ login والـ refresh */
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number; // بالثواني، غالباً 3600 = ساعة
  user: AuthUser;
}

/** رد الـ signup: لو تأكيد الأيميل مقفول بيرجع Session، ولو شغال بيرجع AuthUser بس */
export type SignupResponse = Partial<Session> & AuthUser;

/** رد get_my_profile */
export interface Profile {
  id: string;
  email: string;
  role: Role;
  is_active: boolean;
  full_name: string | null;
  phone: string | null;
  gender: Gender | null;
  date_of_birth: string | null; // "YYYY-MM-DD"
  chronic_disease: string | null;
}

// ---------- Interfaces: البيانات اللي بنبعتها للباك أند ----------------

/** بيانات المريض اللي بتتبعت في data وبتروح user_metadata */
export interface SignupMetadata {
  full_name: string;
  phone: string;
  gender: Gender;
  date_of_birth: string; // "YYYY-MM-DD"
  chronic_disease?: string;
}

/** الـ body بتاع POST /auth/v1/signup */
export interface SignupInput {
  email: string;
  password: string;
  data: SignupMetadata;
}

/** الإعدادات اللي request() بتاخدها */
export interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}
