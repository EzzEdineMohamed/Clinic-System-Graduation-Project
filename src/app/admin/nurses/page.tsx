import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";

export default async function AdminNurses() {
  await requireRole("admin");
  return (
    <>
      <PageTitle title="الممرضين" />
      <ComingNext title="إدارة الممرضين" items={["إضافة ممرض بالأيميل والباسوورد ← ياخد role ممرض على طول", "إيقاف ممرض"]} />
    </>
  );
}
