import { requireRole } from "@/lib/auth";
import { ageFromDob, GENDER_LABEL, NONE } from "@/lib/format";
import { InfoRow, PageTitle } from "@/components/coming-next";
import { Card, CardContent } from "@/components/ui/card";

export default async function PatientProfile() {
  // requireRole already called GET-my-profile (POST /rest/v1/rpc/get_my_profile)
  const p = await requireRole("patient");

  return (
    <>
      <PageTitle title="البروفايل" />
      <Card className="max-w-2xl py-2">
        <CardContent>
          <dl>
            <InfoRow label="الاسم" value={p.full_name} />
            <InfoRow label="رقم الموبايل" value={p.phone} ltr />
            <InfoRow label="الأيميل" value={p.email} ltr />
            <InfoRow label="السن" value={p.date_of_birth ? `${ageFromDob(p.date_of_birth)} سنة` : "-"} />
            <InfoRow label="النوع" value={p.gender ? GENDER_LABEL[p.gender] : "-"} />
            <InfoRow label="مرض مزمن" value={p.chronic_disease || NONE} />
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
