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
    .min(3, "الاسم لازم يكون 3 حروف على الأقل")
    .max(80, "الاسم طويل زيادة"),
  email: z.email("اكتب أيميل صحيح").trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(EG_MOBILE, "رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"),
  password: z.string().min(8, "الباسوورد لازم يكون 8 حروف على الأقل"),
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
    .min(2, "اكتب التخصص")
    .max(60, "التخصص طويل زيادة"),
  consultation_fee: z.coerce
    .number({ error: "اكتب رقم" })
    .positive("السعر لازم يكون أكبر من صفر")
    .max(100000, "السعر كبير زيادة"),
  clinic_share_percent: z.coerce
    .number({ error: "اكتب رقم" })
    .min(0, "النسبة من 0 لـ 100")
    .max(100, "النسبة من 0 لـ 100"),
  slot_minutes: z.coerce
    .number({ error: "اكتب رقم" })
    .int("رقم صحيح من غير كسور")
    .min(5, "من 5 لـ 120 دقيقة")
    .max(120, "من 5 لـ 120 دقيقة"),
});
