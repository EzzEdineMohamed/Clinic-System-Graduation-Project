import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function AdminDoctors() {
  await requireRole("admin");
  return (
    <>
      <PageTitle title="الدكاترة" />
      <ComingNext
        title="إدارة الدكاترة"
        items={[
          "إضافة دكتور (أيميل + باسوورد + تخصص + سعر الكشف + مواعيده) ← ياخد role دكتور على طول",
          "تعديل المواعيد ونسبة العيادة",
          "إيقاف دكتور (مسح ناعم: سجله القديم يفضل موجود)",
        ]}
      />
    </>
  );
}
