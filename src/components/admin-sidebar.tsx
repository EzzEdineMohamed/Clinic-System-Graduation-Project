"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Stethoscope, UserRound, Users, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkPending } from "@/components/link-pending";

const LINKS = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/doctors", label: "الدكاترة", icon: Stethoscope },
  { href: "/admin/nurses", label: "الممرضين", icon: UserRound },
  { href: "/admin/patients", label: "المرضى", icon: Users },
];

export function AdminSidebar({ name, logout }: { name: string; logout: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="grid gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
            <LinkPending className="ms-auto" />
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 font-bold">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        <Stethoscope className="size-4" />
      </span>
      عيادتي <span className="text-xs font-medium text-sidebar-foreground/60">| الإدارة</span>
    </div>
  );

  const footer = (
    <div className="mt-auto border-t border-sidebar-accent pt-4">
      <div className="mb-2 truncate px-3 text-sm font-bold">{name}</div>
      <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-sidebar-foreground/75 [&_button:hover]:bg-sidebar-accent [&_button:hover]:text-sidebar-foreground">
        {logout}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="grid size-9 place-items-center rounded-md hover:bg-sidebar-accent"
          aria-label={open ? "قفل القائمة" : "فتح القائمة"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[3.75rem] bottom-0 z-20 flex flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground lg:hidden">
          {nav}
          {footer}
        </div>
      )}

      {/* Desktop sidebar (right side in RTL) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 bg-sidebar p-5 text-sidebar-foreground lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
