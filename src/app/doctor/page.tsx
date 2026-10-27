import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function DoctorHome() {
  const user = await requireRole("doctor");
  return (
    <>
      <PageTitle title={user.full_name ?? "دكتور"} subtitle="مرضى النهارده" />
      <ComingNext
        title="لوحة الدكتور"
        items={[
          "3 كاردات: عدد مرضى النهارده، العائد، الموجودين لحد دلوقتي",
          "جدول: الاسم، السن، النوع، المرض المزمن، تأكيد الحضور، رفع الروشتة",
          "التشخيص بيتكتب مع تأكيد الحضور أو رفع الروشتة ← record_visit",
        ]}
      />
    </>
  );
}
