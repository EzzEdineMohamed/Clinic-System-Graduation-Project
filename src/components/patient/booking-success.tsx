"use client";

// =====================================================================
// شاشة "الحجز تم" بعد ما الدفع ينجح.
// =====================================================================

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatDay } from "@/lib/dates";
import { formatMoney, formatTime } from "@/lib/format";
import type { BookResult, BookableDoctor, Slot } from "@/types/booking";
import { Button } from "@/components/ui/button";

type Props = {
  doctor: BookableDoctor;
  date: string;
  slot: Slot;
  result: BookResult;
  onAgain: () => void; // يرجع لأول خطوة
};

export function BookingSuccess({ doctor, date, slot, result, onAgain }: Props) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-6 text-center sm:p-8">
      <CheckCircle2 className="mx-auto mb-3 size-14 text-primary" />
      <h2 className="text-2xl font-extrabold">تم الحجز</h2>
      <p className="mt-1 text-muted-foreground">
        تم دفع {formatMoney(result.amount)} وتم حجز موعدك
      </p>

      <dl className="my-6 grid gap-3 rounded-xl bg-muted/50 p-4 text-start text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">الطبيب</dt>
          <dd className="font-semibold">{doctor.full_name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">اليوم</dt>
          <dd className="font-semibold">{formatDay(date)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">الموعد</dt>
          <dd className="font-semibold">
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">رقم العملية</dt>
          <dd dir="ltr" className="font-mono font-semibold">
            {result.reference}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/patient/appointments">سجل حجوزاتي</Link>
        </Button>
        <Button variant="outline" onClick={onAgain}>
          احجز كشفًا آخر
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        يُرجى الحضور إلى العيادة قبل موعدك بـ 10 دقائق
      </p>
    </div>
  );
}
