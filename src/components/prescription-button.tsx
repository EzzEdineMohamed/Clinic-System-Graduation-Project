"use client";

// =====================================================================
// زرار "الروشتة": بيطلب لينك مؤقت (5 دقايق) ويفتح الملف في تاب جديد.
// بيكلم: POST /storage/v1/object/sign/prescriptions/<path>
// بيستخدمه المريض في سجل حجوزاتي، والدكتور في مرضى النهارده.
// =====================================================================

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { authErrorMessage } from "@/lib/api-messages";
import { doctorApi, doctorErrorMessage } from "@/lib/doctor-api";
import { getAccessToken } from "@/lib/session";
import { Button } from "@/components/ui/button";

export function PrescriptionButton({
  path,
  label = "الروشتة",
}: {
  path: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onClick() {
    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة");

    // التاب بيتفتح الأول، علشان المتصفح ميعتبروش popup ويقفله
    const tab = window.open("", "_blank");
    setPending(true);
    setError(undefined);
    try {
      const url = await doctorApi.prescriptionUrl(token, path);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      setError(doctorErrorMessage(err, authErrorMessage));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <FileDown />} {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
