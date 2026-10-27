"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { clearSession, getAccessToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const token = getAccessToken();
    // POST /auth/v1/logout — even if it fails, the cookies are removed locally
    if (token) await api.logout(token).catch(() => {});
    clearSession();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={logout}
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={cn(className)}
      disabled={pending}
      aria-busy={pending}
      aria-label="تسجيل الخروج"
    >
      {pending ? <Loader2 className="animate-spin" /> : <LogOut className="rtl:-scale-x-100" />}
      {!compact && (pending ? "جاري الخروج…" : "تسجيل الخروج")}
    </Button>
  );
}
