// =====================================================================
// صفحة "سجل حجوزاتي": /patient/appointments
// Server Component: بيجيب حجوزات المريض بتوكنه، والـ RLS بيرجّع حجوزاته هو بس.
// =====================================================================

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  FileText,
  Receipt,
  Stethoscope,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import { cairoToday, formatDay } from "@/lib/dates";
import { formatMoney, formatTime } from "@/lib/format";
import type { MyAppointment } from "@/types/booking";
import { PageTitle } from "@/components/coming-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** الحالة اللي بتظهر للمريض. "لم يحضر" = محجوز ويومه عدّى */
function statusOf(a: MyAppointment, today: string) {
  if (a.status === "cancelled")
    return { label: "ملغي", variant: "destructive" as const };
  if (a.status === "attended")
    return { label: "تم الكشف", variant: "default" as const };
  if (a.appointment_date < today)
    return { label: "لم يحضر", variant: "secondary" as const };
  return { label: "محجوز", variant: "outline" as const };
}

function AppointmentCard({ a, today }: { a: MyAppointment; today: string }) {
  const status = statusOf(a, today);
  return (
    <article className="grid gap-3 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-bold">
            <Stethoscope className="size-4 text-primary" />
            {a.doctor.profile.full_name}
          </p>
          <p className="text-sm text-muted-foreground">{a.doctor.specialty}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-muted-foreground" />{" "}
          {formatDay(a.appointment_date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4 text-muted-foreground" />{" "}
          {formatTime(a.start_time)} – {formatTime(a.end_time)}
        </span>
        <span className="flex items-center gap-1.5">
          <Receipt className="size-4 text-muted-foreground" />{" "}
          {formatMoney(a.fee)}
          {a.payment && (
            <span className="text-muted-foreground">
              · {a.payment.method === "card" ? "فيزا" : "كاش"} ·{" "}
              {a.source === "online" ? "أونلاين" : "من العيادة"}
            </span>
          )}
        </span>
      </div>

      {a.payment?.gateway_reference && (
        <p className="text-xs text-muted-foreground">
          رقم العملية:{" "}
          <span dir="ltr" className="font-mono">
            {a.payment.gateway_reference}
          </span>
        </p>
      )}

      {a.status === "attended" && (
        <div className="grid gap-1 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold">
            <FileText className="size-4" /> التشخيص
          </p>
          <p className="text-muted-foreground">
            {a.diagnosis ?? "الدكتور مكتبش تشخيص"}
          </p>
          {/* تنزيل الروشتة هيتعمل مع موديول الدكتور */}
        </div>
      )}
    </article>
  );
}

export default async function PatientAppointments() {
  const user = await requireRole("patient");
  const today = cairoToday();

  let appointments: MyAppointment[] = [];
  let error: string | undefined;
  try {
    appointments = await bookingApi.myAppointments(user.token);
  } catch (err) {
    error = authErrorMessage(err);
  }

  // الجاية: محجوزة ويومها النهارده أو بعد كده، الأقرب الأول
  const upcoming = appointments
    .filter((a) => a.status === "booked" && a.appointment_date >= today)
    .reverse();
  // الباقي: اللي عدّت أو اتكشفت أو اتلغت، الأحدث الأول
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <>
      <PageTitle title="سجل حجوزاتي" subtitle={`${appointments.length} حجز`} />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && appointments.length === 0 && (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="text-muted-foreground">مفيش حجوزات لسه</p>
          <Button asChild>
            <Link href="/patient">احجز كشف</Link>
          </Button>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">الحجوزات الجاية</h2>
          <div className="grid gap-3">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} a={a} today={today} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">الحجوزات اللي فاتت</h2>
          <div className="grid gap-3">
            {past.map((a) => (
              <AppointmentCard key={a.id} a={a} today={today} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
