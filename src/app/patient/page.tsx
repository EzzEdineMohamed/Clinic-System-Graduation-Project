import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function PatientHome() {
  const user = await requireRole("patient");
  return (
    <>
      <PageTitle title={`أهلاً ${(user.full_name ?? "").split(" ")[0]}`} subtitle="اختار الدكتور والميعاد اللي يناسبك" />
      <ComingNext
        title="حجز كشف"
        items={[
          "قائمة الدكاترة بالتخصص وسعر الكشف",
          "اختيار يوم من أيام الدكتور وميعاد فاضي (كل 20 دقيقة)",
          "الدفع ببوابة وهمية ← book_appointment",
          "شاشة الحجز تم + زرار يرجعك للرئيسية",
        ]}
      />
    </>
  );
}
