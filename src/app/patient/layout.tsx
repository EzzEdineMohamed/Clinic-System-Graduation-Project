import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("patient");
  return (
    <>
      <AppHeader
        user={user}
        items={[
          { href: "/patient", label: "احجز كشف" },
          { href: "/patient/appointments", label: "سجل حجوزاتي" },
          { href: "/patient/profile", label: "البروفايل" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
