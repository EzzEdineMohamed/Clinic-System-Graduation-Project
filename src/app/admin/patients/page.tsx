import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function AdminPatients() {
  await requireRole("admin");
  return (
    <>
      <PageTitle title="المرضى" />
      <ComingNext
        title="بيانات المرضى"
        items={["كاردات: عدد المرضى، ذكور، إناث", "جدول: الاسم، السن، تاريخ الإضافة، الموبايل، النوع"]}
      />
    </>
  );
}
