// =====================================================================
// Validation schemas — فورمز لوحة الأدمن
// نفس قواعد الـ Edge Function (create-staff) والداتابيز، علشان الغلط
// يبان تحت الخانة على طول من غير ما نستنى السيرفر.
// =====================================================================

import { z } from "zod";
import { EG_MOBILE } from "@/lib/validation/auth";

/** فورم موظف جديد (دكتور أو ممرضة) */
export const staffSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "يجب أن يتكون الاسم من 3 أحرف على الأقل")
    .max(80, "الاسم طويل جدًا"),
  email: z.email("أدخل بريدًا إلكترونيًا صحيحًا").trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(EG_MOBILE, "رقم هاتف مصري صحيح (11 رقمًا يبدأ بـ 01)"),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"),
});

/** فورم تعديل موظف: الاسم والموبايل بس */
export const staffUpdateSchema = staffSchema.pick({
  full_name: true,
  phone: true,
});

/** فورم بيانات الكشف (المواعيد بتتراجع في الـ Component نفسه) */
export const doctorDetailsSchema = z.object({
  specialty: z
    .string()
    .trim()
    .min(2, "أدخل التخصص")
    .max(60, "التخصص طويل جدًا"),
  consultation_fee: z.coerce
    .number({ error: "أدخل رقمًا" })
    .positive("يجب أن يكون السعر أكبر من صفر")
    .max(100000, "السعر كبير جدًا"),
  clinic_share_percent: z.coerce
    .number({ error: "أدخل رقمًا" })
    .min(0, "النسبة من 0 إلى 100")
    .max(100, "النسبة من 0 إلى 100"),
  slot_minutes: z.coerce
    .number({ error: "أدخل رقمًا" })
    .int("رقم صحيح بدون كسور")
    .min(5, "من 5 إلى 120 دقيقة")
    .max(120, "من 5 إلى 120 دقيقة"),
});
