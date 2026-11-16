// =====================================================================
// صفحة الحجوزات (الممرضة): /nurse?date=2026-11-18&doctor=<id>
// Server Component: بيجيب الدكاترة وحجوزات اليوم بتوكن الممرضة.
// اختيار اليوم والدكتور فورم GET عادي، زي بحث المرضى في لوحة الأدمن.
// =====================================================================

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import { addDays, cairoToday, formatDay } from "@/lib/dates";
import { formatMoney, formatTime } from "@/lib/format";
import { bookingPerson, nurseApi } from "@/lib/nurse-api";
import type { BookableDoctor } from "@/types/booking";
import type { DayBooking } from "@/types/nurse";
import { PageTitle } from "@/components/coming-next";
import { CancelBooking } from "@/components/nurse/cancel-booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS = {
  booked: { label: "محجوز", variant: "outline" },
  attended: { label: "حضر", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
} as const;

export default async function NurseBookings({
  searchParams,
}: PageProps<"/nurse">) {
  const user = await requireRole("nurse");
  const today = cairoToday();

  // اليوم والدكتور من الـ URL، ولو مش موجودين أو غلط: النهارده وكل الدكاترة
  const { date: qDate, doctor: qDoctor } = await searchParams;
  const date =
    typeof qDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(qDate)
      ? qDate
      : today;
  const doctorId = typeof qDoctor === "string" && qDoctor ? qDoctor : undefined;

  let doctors: BookableDoctor[] = [];
  let bookings: DayBooking[] = [];
  let error: string | undefined;

  try {
    [doctors, bookings] = await Promise.all([
      bookingApi.listDoctors(user.token),
      nurseApi.dayBookings(user.token, date, doctorId),
    ]);
  } catch (err) {
    error = authErrorMessage(err);
  }

  const count = (s: DayBooking["status"]) =>
    bookings.filter((b) => b.status === s).length;
  const canCancel = date >= today; // الحجوزات اللي يومها عدّى مبتتلغيش

  /** لينك ليوم تاني بنفس فلتر الدكتور */
  const dayHref = (d: string) =>
    `/nurse?date=${d}${doctorId ? `&doctor=${doctorId}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          title="الحجوزات"
          subtitle={`${formatDay(date)} · ${count("booked")} محجوز · ${count("attended")} حضر · ${count("cancelled")} ملغي`}
        />
        <Button asChild>
          <Link href="/nurse/new">
            <Plus /> حجز جديد
          </Link>
        </Button>
      </div>

      {/* ===== اختيار اليوم والدكتور ===== */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            اليوم
            <Input
              type="date"
              name="date"
              defaultValue={date}
              className="w-44"
              dir="ltr"
            />
          </label>
          <label className="grid gap-1 text-sm">
            الطبيب
            <select
              name="doctor"
              defaultValue={doctorId ?? ""}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">جميع الأطباء</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} · {d.doctors.specialty}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">
            <CalendarDays /> عرض
          </Button>
        </form>

        <div className="flex gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={dayHref(addDays(date, -1))}>اليوم السابق</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={dayHref(today)}>اليوم</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={dayHref(addDays(date, 1))}>اليوم التالي</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ===== الجدول ===== */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الموعد</TableHead>
              <TableHead>المريض</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الطبيب</TableHead>
              <TableHead>الحجز</TableHead>
              <TableHead>الدفع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  لا توجد حجوزات في هذا اليوم
                </TableCell>
              </TableRow>
            )}
            {bookings.map((b) => {
              const person = bookingPerson(b);
              const status = STATUS[b.status];
              return (
                <TableRow
                  key={b.id}
                  className={b.status === "cancelled" ? "opacity-60" : ""}
                >
                  <TableCell className="font-semibold" dir="rtl">
                    {formatTime(b.start_time)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{person.name}</span>{" "}
                    {!person.hasFile && (
                      <Badge variant="secondary">بدون ملف</Badge>
                    )}
                  </TableCell>
                  <TableCell dir="rtl" className="text-start">
                    {person.phone}
                  </TableCell>
                  <TableCell>
                    <div>{b.doctor.profile.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.doctor.specialty}
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.source === "online" ? "عبر الإنترنت" : "العيادة"}
                  </TableCell>
                  <TableCell>
                    {formatMoney(b.fee)}
                    {b.payment && (
                      <div className="text-xs text-muted-foreground">
                        {b.payment.method === "card" ? "بطاقة" : "نقدًا"}
                        {b.payment.status === "refunded" && " · مُسترد"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {b.status === "booked" && canCancel && (
                      <CancelBooking booking={b} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
