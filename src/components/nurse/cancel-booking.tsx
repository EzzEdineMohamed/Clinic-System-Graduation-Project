"use client";

// =====================================================================
// زرار "إلغاء" جنب كل حجز محجوز.
// بيكلم: POST /rest/v1/rpc/cancel_appointment
// بعد ما ينجح بيعرض رسالة الباك أند والمبلغ اللي يرجع للمريض.
// =====================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { formatMoney, formatTime } from "@/lib/format";
import { bookingPerson, nurseApi } from "@/lib/nurse-api";
import { getAccessToken } from "@/lib/session";
import type { CancelResult, DayBooking } from "@/types/nurse";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CancelBooking({ booking }: { booking: DayBooking }) {
  const router = useRouter();
  const person = bookingPerson(booking);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<CancelResult | null>(null); // الإلغاء نجح

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setError(undefined);
      if (done) router.refresh(); // الجدول يتحدث بعد ما تقفل رسالة النجاح
      setDone(null);
    }
  }

  async function onConfirm(e: React.MouseEvent) {
    e.preventDefault(); // AlertDialogAction بيقفل لوحده، وإحنا عايزينه يستنى الرد
    const token = getAccessToken();
    if (!token) return setError("انتهت الجلسة، أعد تحميل الصفحة وحاول مرة أخرى");

    setPending(true);
    try {
      setDone(await nurseApi.cancel(token, booking.id));
    } catch (err) {
      // P0001 = اتلغى قبل كده أو يومه عدّى، و 42501 = مش ممرضة
      setError(
        err instanceof ApiError &&
          (err.code === "P0001" || err.code === "42501")
          ? err.message
          : authErrorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <X /> إلغاء
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        {done ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" /> {done.message}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {done.refund_amount > 0
                  ? `أعيدي للمريض ${formatMoney(done.refund_amount)}، وأصبح الموعد متاحًا لحجز جديد.`
                  : "أصبح الموعد متاحًا لحجز جديد."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>حسنًا</AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>إلغاء حجز {person.name}؟</AlertDialogTitle>
              <AlertDialogDescription>
                الساعة {formatTime(booking.start_time)} مع{" "}
                {booking.doctor.profile.full_name}. سيُسجَّل الحجز ملغيًا، ويُسجَّل المبلغ مستردًا للمريض.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                disabled={pending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {pending ? "جارٍ التنفيذ…" : "نعم، ألغِ الحجز"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
