import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function NurseHome() {
  await requireRole("nurse");
  return (
    <>
      <PageTitle title="الحجوزات" />
      <ComingNext
        title="شغل الممرضة"
        items={[
          "حجز للمريض اللي جه العيادة (مريض جديد من غير حساب أو مريض موجود)",
          "ليستة الحجوزات وجنب كل حجز: أونلاين ولا من العيادة",
          "إلغاء حجز ← cancel_appointment ويظهر ملغي في سجل المريض",
        ]}
      />
    </>
  );
}
