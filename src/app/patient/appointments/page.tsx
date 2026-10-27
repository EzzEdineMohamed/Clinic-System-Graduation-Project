import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function PatientAppointments() {
  await requireRole("patient");
  return (
    <>
      <PageTitle title="سجل حجوزاتي" />
      <ComingNext
        title="جدول الحجوزات"
        items={["اسم الدكتور", "الحالة: محجوز / حضر / لم يحضر / ملغي", "تمن الكشف", "التشخيص", "تنزيل الروشتة", "تاريخ الكشف"]}
      />
    </>
  );
}
