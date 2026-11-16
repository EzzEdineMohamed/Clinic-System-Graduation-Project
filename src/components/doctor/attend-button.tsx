"use client";

// =====================================================================
// زرار "حضر" جنب المريض اللي لسه محجوز.
// بيكلم: POST /rest/v1/rpc/mark_attended
// =====================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { authErrorMessage } from "@/lib/api-messages";
import { doctorApi, doctorErrorMessage } from "@/lib/doctor-api";
import { getAccessToken } from "@/lib/session";
import { Button } from "@/components/ui/button";

export function AttendButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onClick() {
    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة");

    setPending(true);
    setError(undefined);
    try {
      await doctorApi.markAttended(token, appointmentId);
      router.refresh(); // الحالة تبقى "حضر"، ويظهر زرار الكشف
    } catch (err) {
      setError(doctorErrorMessage(err, authErrorMessage));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-1">
      <Button size="sm" onClick={onClick} disabled={pending}>
        <UserCheck /> {pending ? "استنى…" : "حضر"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
