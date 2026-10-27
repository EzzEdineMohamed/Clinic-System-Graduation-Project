import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar name={user.full_name ?? ""} logout={<LogoutButton />} />
      <main className="w-full min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
