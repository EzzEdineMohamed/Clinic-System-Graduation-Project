import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function NurseLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("nurse");
  return (
    <>
      <AppHeader
        user={user}
        items={[
          { href: "/nurse", label: "الحجوزات" },
          { href: "/nurse/profile", label: "حسابي" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
