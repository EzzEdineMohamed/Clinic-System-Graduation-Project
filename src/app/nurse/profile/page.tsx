import { requireRole } from "@/lib/auth";
import { InfoRow, PageTitle } from "@/components/coming-next";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default async function NurseProfile() {
  const user = await requireRole("nurse");
  return (
    <>
      <PageTitle title="حسابي" />
      <Card className="max-w-2xl pb-4">
        <CardContent>
          <dl>
            <InfoRow label="الاسم" value={user.full_name ?? ""} />
            <InfoRow label="الأيميل" value={user.email} ltr />
            <InfoRow label="رقم الموبايل" value={user.phone} ltr />
          </dl>
        </CardContent>
        <CardFooter>
          <LogoutButton />
        </CardFooter>
      </Card>
    </>
  );
}
