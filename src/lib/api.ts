// =====================================================================
// المكان الوحيد في المشروع اللي بيكلم الباك أند.
// كل function هنا = endpoint واحد في Supabase، بـ fetch عادي من غير مكتبة.
// بيشتغل في المتصفح وعلى سيرفر Next.js بنفس الشكل.
// الـ types موجودة في src/types/auth.ts
// =====================================================================

import type {
  Profile,
  RequestOptions,
  Session,
  SignupInput,
  SignupResponse,
} from "@/types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// ---------- الـ Error ---------------------------------------------------

/** أي request يفشل بيرمي الـ error ده، و code بيقولك إيه اللي حصل */
export class ApiError extends Error {
  constructor(
    public status: number, // الـ HTTP status، و 0 = موصلناش للسيرفر خالص
    public code: string, // زي "invalid_credentials" أو "user_already_exists" أو "network"
    message: string,
  ) {
    super(message);
  }
}

// ---------- الـ function الوحيدة اللي بتعمل fetch ---------------------

async function request<T>(
  path: string,
  { method = "POST", body, token }: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: {
        apikey: PUBLIC_KEY,
        Authorization: `Bearer ${token ?? PUBLIC_KEY}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network", "مش قادر أوصل للسيرفر. اتأكد من النت.");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // الـ Auth بيرجع { error_code, msg }، والـ RPC بيرجع { code, message }
    const code = data?.error_code ?? data?.code ?? String(res.status);
    const message = data?.msg ?? data?.message ?? "حصلت مشكلة، حاول تاني";
    throw new ApiError(res.status, String(code), message);
  }
  return data as T;
}

// ---------- الـ Endpoints -----------------------------------------------

export const api = {
  /** POST /auth/v1/signup: مريض جديد. اللي في data بيروح user_metadata، والـ trigger بيعمل منه سجل المريض */
  signup: (input: SignupInput) =>
    request<SignupResponse>("/auth/v1/signup", { body: input }),

  /** POST /auth/v1/token?grant_type=password: تسجيل الدخول */
  login: (email: string, password: string) =>
    request<Session>("/auth/v1/token?grant_type=password", { body: { email, password } }),

  /** POST /auth/v1/token?grant_type=refresh_token: توكن جديد لما القديم يخلص */
  refresh: (refreshToken: string) =>
    request<Session>("/auth/v1/token?grant_type=refresh_token", { body: { refresh_token: refreshToken } }),

  /** POST /auth/v1/logout: يقفل الـ session على السيرفر */
  logout: (token: string) => request<null>("/auth/v1/logout", { token }),

  /** POST /rest/v1/rpc/get_my_profile: أنا مين، والـ role بتاعي إيه */
  me: (token: string) => request<Profile | null>("/rest/v1/rpc/get_my_profile", { token, body: {} }),

  /** POST /rest/v1/rpc/is_phone_registered: بيشتغل من غير دخول (صفحة الـ Register) */
  isPhoneRegistered: (phone: string) =>
    request<boolean>("/rest/v1/rpc/is_phone_registered", { body: { p_phone: phone } }),

  /** أي دالة تانية في الداتابيز: POST /rest/v1/rpc/<name>. للموديولات الجاية */
  rpc: <T>(name: string, params: Record<string, unknown>, token?: string) =>
    request<T>(`/rest/v1/rpc/${name}`, { token, body: params }),
};
