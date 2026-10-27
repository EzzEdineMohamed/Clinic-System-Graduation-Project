import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("doctor");
  return (
    <>
      <AppHeader user={user} items={[{ href: "/doctor", label: "مرضى النهارده" }]} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
