import Link from "next/link";
import { Stethoscope } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { LogoutButton } from "@/components/logout-button";

export function AppHeader({ user, items }: { user: CurrentUser; items: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href={ROLE_HOME[user.role]} className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="size-4" />
          </span>
          عيادتي
        </Link>

        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <NavLinks items={items} />
        </div>

        <div className="ms-auto flex items-center gap-3 sm:ms-0">
          <div className="text-end leading-tight">
            <div className="max-w-40 truncate text-sm font-bold">{user.full_name ?? ""}</div>
            <div className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</div>
          </div>
          <LogoutButton compact />
        </div>
      </div>
    </header>
  );
}
