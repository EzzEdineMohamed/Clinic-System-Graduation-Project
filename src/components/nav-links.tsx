"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LinkPending } from "@/components/link-pending";

export type NavItem = { href: string; label: string };

/** Top navbar links (patient / nurse / doctor). Scrolls sideways on phones. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
            <LinkPending />
          </Link>
        );
      })}
    </nav>
  );
}
