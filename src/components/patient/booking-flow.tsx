"use client";

// =====================================================================
// خطوات الحجز: اختار الدكتور ← اختار اليوم ← اختار الميعاد ← الدفع.
// الدكاترة جايين جاهزين من الصفحة (Server)، والمواعيد بنجيبها هنا
// لما المريض يختار يوم: POST /rest/v1/rpc/get_available_slots
// =====================================================================

import { useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import { formatDay, upcomingDays } from "@/lib/dates";
import { DAY_NAMES, formatMoney, formatTime } from "@/lib/format";
import { getAccessToken } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { BookResult, BookableDoctor, Slot } from "@/types/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookingSuccess } from "@/components/patient/booking-success";
import { PaymentForm } from "@/components/patient/payment-from";

/** عنوان كل خطوة: رقم في دايرة + كلام */
function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
        {n}
      </span>
      {title}
    </h2>
  );
}

export function BookingFlow({ doctors }: { doctors: BookableDoctor[] }) {
  const [doctor, setDoctor] = useState<BookableDoctor | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null); // null = لسه مجبناش
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>(); // "الميعاد اتحجز" بعد ما المواعيد تتحدث
  const [booked, setBooked] = useState<BookResult | null>(null);
  const lastRequest = useRef(0); // علشان لو دوس على يومين ورا بعض، ناخد رد آخر واحد بس

  function chooseDoctor(d: BookableDoctor) {
    setDoctor(d);
    setDate(null);
    setSlots(null);
    setSlot(null);
    setError(undefined);
    setNotice(undefined);
  }

  async function chooseDate(day: string) {
    if (!doctor) return;
    setDate(day);
    setSlots(null);
    setSlot(null);
    setError(undefined);

    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني");

    const id = ++lastRequest.current;
    setLoading(true);
    try {
      const result = await bookingApi.getSlots(token, doctor.id, day);
      if (id === lastRequest.current) setSlots(result);
    } catch (err) {
      if (id !== lastRequest.current) return;
      // P0001 = رسايلنا العربي من الدالة (اليوم برة المدى، الدكتور مش متاح)
      setError(
        err instanceof ApiError && err.code === "P0001"
          ? err.message
          : authErrorMessage(err),
      );
    } finally {
      if (id === lastRequest.current) setLoading(false);
    }
  }

  /** حد سبقه للميعاد: نجيب المواعيد تاني ونعرفه */
  async function slotTaken(message: string) {
    if (!date) return;
    await chooseDate(date);
    setNotice(message);
  }

  /** "احجز كشف تاني": نرجع لأول خطوة */
  function startOver() {
    setBooked(null);
    setDoctor(null);
    setDate(null);
    setSlots(null);
    setSlot(null);
    setNotice(undefined);
  }

  if (doctors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground">
        مفيش دكاترة متاحين للحجز دلوقتي
      </div>
    );
  }

  if (booked && doctor && date && slot) {
    return (
      <BookingSuccess
        doctor={doctor}
        date={date}
        slot={slot}
        result={booked}
        onAgain={startOver}
      />
    );
  }

  const days = doctor
    ? upcomingDays(doctor.doctors.doctor_schedules.map((s) => s.day_of_week))
    : [];

  return (
    <div className="grid gap-10">
      {/* ===== 1) الدكتور ===== */}
      <section>
        <StepTitle n={1} title="اختار الدكتور" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => {
            const selected = doctor?.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => chooseDoctor(d)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border bg-card p-4 text-start transition-colors hover:border-primary/60",
                  selected && "border-primary bg-accent/50 ring-1 ring-primary",
                )}
              >
                <span className="flex items-center gap-2 font-bold">
                  <Stethoscope className="size-4 text-primary" />
                  {d.full_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {d.doctors.specialty}
                </span>
                <span className="text-sm">
                  <span className="font-semibold">
                    {formatMoney(d.doctors.consultation_fee)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {d.doctors.slot_minutes} دقيقة
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.doctors.doctor_schedules
                    .map((s) => DAY_NAMES[s.day_of_week])
                    .join(" · ")}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== 2) اليوم والميعاد ===== */}
      {doctor && (
        <section>
          <StepTitle n={2} title="اختار اليوم والميعاد" />

          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4" /> الأيام المتاحة (لحد 30 يوم قدام)
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => chooseDate(day)}
                aria-pressed={date === day}
                className={cn(
                  "rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/60",
                  date === day &&
                    "border-primary bg-primary text-primary-foreground hover:border-primary",
                )}
              >
                {formatDay(day)}
              </button>
            ))}
          </div>

          {date && (
            <>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4" /> المواعيد الفاضية يوم{" "}
                {formatDay(date)}
              </p>

              {loading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> بنجيب المواعيد…
                </p>
              )}

              {notice && (
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {slots && slots.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  مفيش مواعيد فاضية في اليوم ده، جرّب يوم تاني
                </p>
              )}

              {slots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                  {slots.map((s) => (
                    <button
                      key={s.start_time}
                      type="button"
                      onClick={() => setSlot(s)}
                      aria-pressed={slot?.start_time === s.start_time}
                      dir="ltr"
                      className={cn(
                        "rounded-lg border bg-card px-2 py-2 text-sm font-semibold transition-colors hover:border-primary/60",
                        slot?.start_time === s.start_time &&
                          "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {formatTime(s.start_time)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ===== 3) الملخص والدفع ===== */}
      {doctor && date && slot && (
        <section>
          <StepTitle n={3} title="الملخص والدفع" />
          <dl className="mb-4 grid gap-2 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">الدكتور</dt>
              <dd className="font-semibold">
                {doctor.full_name} · {doctor.doctors.specialty}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">اليوم</dt>
              <dd className="font-semibold">{formatDay(date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">الميعاد</dt>
              <dd className="font-semibold">
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">سعر الكشف</dt>
              <dd className="font-semibold">
                {formatMoney(doctor.doctors.consultation_fee)}
              </dd>
            </div>
          </dl>
          <PaymentForm
            key={`${date}-${slot.start_time}`}
            doctor={doctor}
            date={date}
            slot={slot}
            onBooked={setBooked}
            onSlotTaken={slotTaken}
          />
        </section>
      )}
    </div>
  );
}
