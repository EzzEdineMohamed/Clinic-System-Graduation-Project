import { ApiError } from "@/lib/api";

/** Arabic message for errors any auth call can return. */
export function authErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "حصلت مشكلة غير متوقعة، حاول تاني";
  switch (e.code) {
    case "invalid_credentials":
      return "الأيميل أو الباسوورد غلط";
    case "email_not_confirmed":
      return "لازم تأكد الأيميل الأول من الرسالة اللي وصلتك";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "محاولات كتير ورا بعض، استنى دقيقة وجرب تاني";
    case "network":
      return "مش قادر أوصل للسيرفر. اتأكد من النت ومن NEXT_PUBLIC_SUPABASE_URL في .env.local";
    default:
      console.error("[api]", e.status, e.code, e.message);
      return "حصلت مشكلة غير متوقعة، حاول تاني";
  }
}
