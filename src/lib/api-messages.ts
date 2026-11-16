import { ApiError } from "@/lib/api";

/** Arabic message for errors any auth call can return. */
export function authErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "حدثت مشكلة غير متوقعة، حاول مرة أخرى";
  switch (e.code) {
    case "invalid_credentials":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
    case "email_not_confirmed":
      return "يجب تأكيد البريد الإلكتروني أولًا من الرسالة التي وصلتك";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "محاولات كثيرة متتالية، انتظر دقيقة ثم حاول مرة أخرى";
    case "network":
      return "تعذّر الاتصال بالخادم. تأكد من الاتصال بالإنترنت ومن NEXT_PUBLIC_SUPABASE_URL في .env.local";
    default:
      console.error("[api]", e.status, e.code, e.message);
      return "حدثت مشكلة غير متوقعة، حاول مرة أخرى";
  }
}
