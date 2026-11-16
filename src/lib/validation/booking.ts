// =====================================================================
// Validation schemas — فورم الدفع
// الباك أند هو اللي بيقرر الكارت مقبول ولا لأ (البوابة الوهمية).
// هنا بنتأكد بس إن الشكل صح قبل ما نبعت.
// =====================================================================

import { z } from "zod";

/** "MM/YY" → البطاقة لسه شغالة؟ (شغالة لحد آخر يوم في الشهر ده) */
function notExpired(value: string) {
  const [month, year] = value.split("/").map(Number);
  const firstDayAfter = new Date(2000 + year, month, 1); // أول يوم في الشهر اللي بعده
  return firstDayAfter > new Date();
}

export const cardSchema = z.object({
  card_number: z
    .string()
    .transform((v) => v.replace(/\s/g, "")) // نشيل المسافات
    .pipe(z.string().regex(/^\d{16}$/, "رقم البطاقة 16 رقمًا")),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "أدخل التاريخ بالشكل: MM/YY")
    .refine(notExpired, "هذه البطاقة منتهية الصلاحية"),
  cvv: z
    .string()
    .trim()
    .regex(/^\d{3}$/, "رمز CVV مكوّن من 3 أرقام"),
});
