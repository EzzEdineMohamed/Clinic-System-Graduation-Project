"use client";

// =====================================================================
// حجز جديد من العيادة (الممرضة):
//   1) المريض: تدوّر برقمه، يا عنده ملف، يا تكتب اسمه ويتحجز من غير ملف
//   2) الدكتور واليوم والميعاد
//   3) كاش ولا فيزا ← احجز
// بيكلم: patients (N1) و get_available_slots و book_appointment (N3)
// =====================================================================

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import { formatDay, upcomingDays } from "@/lib/dates";
import { formatMoney, formatTime } from "@/lib/format";
import { nurseApi } from "@/lib/nurse-api";
import { getAccessToken } from "@/lib/session";
import { cn } from "@/lib/utils";
import { EG_MOBILE } from "@/lib/validation/auth";
import type { BookResult, BookableDoctor, Slot } from "@/types/booking";
import type { PatientMatch } from "@/types/nurse";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

/** الجلسة خلصت؟ */
const NO_TOKEN = "الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني";

export function ClinicBooking({ doctors }: { doctors: BookableDoctor[] }) {
  // ---------- 1) المريض ----------
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string>();
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false); // دوّرنا بالرقم ده خلاص
  const [patient, setPatient] = useState<PatientMatch | null>(null); // null + searched = ملوش ملف
  const [guestName, setGuestName] = useState("");

  // ---------- 2) الدكتور واليوم والميعاد ----------
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const lastRequest = useRef(0);

  // ---------- 3) الدفع ----------
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [result, setResult] = useState<BookResult | null>(null);

  const doctor = doctors.find((d) => d.id === doctorId) ?? null;
  const digits = phone.replace(/\D/g, "");
  const personReady =
    patient !== null || (searched && guestName.trim().length >= 3);
  const personName = patient?.full_name ?? guestName.trim();

  // ===== 1) البحث بالرقم =====
  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!EG_MOBILE.test(digits))
      return setPhoneError("رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)");
    setPhoneError(undefined);
    setError(undefined);

    const token = getAccessToken();
    if (!token) return setError(NO_TOKEN);

    setSearching(true);
    try {
      setPatient(await nurseApi.findPatientByPhone(token, digits));
      setSearched(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  function changePhone(value: string) {
    setPhone(value);
    setSearched(false); // الرقم اتغير، لازم يدوّر تاني
    setPatient(null);
    setGuestName("");
  }

  // ===== 2) الدكتور واليوم =====
  function chooseDoctor(id: string) {
    setDoctorId(id);
    setDate(null);
    setSlots(null);
    setSlot(null);
    setNotice(undefined);
  }

  async function chooseDate(day: string) {
    if (!doctor) return;
    setDate(day);
    setSlots(null);
    setSlot(null);
    setError(undefined);
    setNotice(undefined);

    const token = getAccessToken();
    if (!token) return setError(NO_TOKEN);

    const id = ++lastRequest.current;
    setLoadingSlots(true);
    try {
      const rows = await bookingApi.getSlots(token, doctor.id, day);
      if (id === lastRequest.current) setSlots(rows);
    } catch (err) {
      if (id === lastRequest.current) {
        setError(
          err instanceof ApiError && err.code === "P0001"
            ? err.message
            : authErrorMessage(err),
        );
      }
    } finally {
      if (id === lastRequest.current) setLoadingSlots(false);
    }
  }

  // ===== 3) الحجز =====
  async function book() {
    if (!doctor || !date || !slot || !personReady) return;
    setError(undefined);
    setNotice(undefined);

    const token = getAccessToken();
    if (!token) return setError(NO_TOKEN);

    const base = {
      p_doctor_id: doctor.id,
      p_date: date,
      p_start_time: slot.start_time.slice(0, 5),
      p_method: method,
    };
    setPending(true);
    try {
      const res = await nurseApi.book(
        token,
        patient
          ? { ...base, p_patient_id: patient.id }
          : { ...base, p_guest_name: guestName.trim(), p_guest_phone: digits },
      );
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.code === "P0001") {
        if (err.message.includes("اتحجز خلاص")) {
          await chooseDate(date); // حد سبقها للميعاد: نجيب المواعيد تاني
          setNotice(err.message);
        } else {
          setError(err.message); // عنده حجز تاني في اليوم ده، أو أي رسالة تانية
        }
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  /** "احجز لمريض تاني": نرجع لأول خطوة */
  function startOver() {
    changePhone("");
    chooseDoctor("");
    setMethod("cash");
    setResult(null);
    setError(undefined);
  }

  // ===== شاشة النجاح =====
  if (result && doctor && date && slot) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto mb-3 size-14 text-primary" />
        <h2 className="text-2xl font-extrabold">الحجز تم</h2>
        <p className="mt-1 text-muted-foreground">
          اتدفع {formatMoney(result.amount)}{" "}
          {method === "cash" ? "كاش" : "فيزا"}
        </p>
        <dl className="my-6 grid gap-3 rounded-xl bg-muted/50 p-4 text-start text-sm">
          {[
            ["المريض", personName],
            ["الدكتور", doctor.full_name],
            ["اليوم", formatDay(date)],
            [
              "الميعاد",
              `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`,
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">رقم العملية</dt>
            <dd dir="ltr" className="font-mono font-semibold">
              {result.reference}
            </dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={startOver}>احجز لمريض تاني</Button>
          <Button variant="outline" asChild>
            <Link href={`/nurse?date=${date}`}>حجوزات اليوم ده</Link>
          </Button>
        </div>
      </div>
    );
  }

  const days = doctor
    ? upcomingDays(doctor.doctors.doctor_schedules.map((s) => s.day_of_week))
    : [];

  return (
    <div className="grid gap-10">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ===== 1) المريض ===== */}
      <section>
        <StepTitle n={1} title="المريض" />
        <form
          onSubmit={search}
          noValidate
          className="flex max-w-md flex-wrap items-end gap-2"
        >
          <div className="grid flex-1 gap-1">
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input
              id="phone"
              inputMode="numeric"
              dir="ltr"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => changePhone(e.target.value)}
              aria-invalid={!!phoneError}
            />
          </div>
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 className="animate-spin" /> : <Search />} دوّر
          </Button>
          {phoneError && (
            <p className="w-full text-sm text-destructive">{phoneError}</p>
          )}
        </form>

        {searched && patient && (
          <div className="mt-4 flex max-w-md items-center gap-3 rounded-xl border border-primary bg-accent/40 p-4">
            <UserCheck className="size-6 text-primary" />
            <p className="font-bold">{patient.full_name}</p>
          </div>
        )}

        {searched && !patient && (
          <div className="mt-4 grid max-w-md gap-2 rounded-xl border border-dashed p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="size-4" />
              هذا الرقم غير مسجل
            </p>
            <Input
              placeholder="اسم المريض"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              aria-invalid={guestName.length > 0 && guestName.trim().length < 3}
            />
            {guestName.length > 0 && guestName.trim().length < 3 && (
              <p className="text-sm text-destructive">الاسم 3 حروف على الأقل</p>
            )}
          </div>
        )}
      </section>

      {/* ===== 2) الدكتور واليوم والميعاد ===== */}
      {personReady && (
        <section>
          <StepTitle n={2} title="الدكتور والميعاد" />

          <Label htmlFor="doctor" className="mb-1">
            الدكتور
          </Label>
          <select
            id="doctor"
            value={doctorId}
            onChange={(e) => chooseDoctor(e.target.value)}
            className="mb-6 h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">اختاري الدكتور</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} · {d.doctors.specialty} ·{" "}
                {formatMoney(d.doctors.consultation_fee)}
              </option>
            ))}
          </select>

          {doctor && (
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
          )}

          {date && (
            <>
              {notice && (
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}
              {loadingSlots && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> بنجيب المواعيد…
                </p>
              )}
              {slots && slots.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  مفيش مواعيد فاضية في اليوم ده
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

      {/* ===== 3) الدفع والحجز ===== */}
      {personReady && doctor && date && slot && (
        <section className="grid max-w-xl gap-4">
          <StepTitle n={3} title="الدفع" />

          <p className="text-sm">
            <span className="font-semibold">{personName}</span> ·{" "}
            {doctor.full_name} · {formatDay(date)} ·{" "}
            {formatTime(slot.start_time)}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["cash", "كاش", Banknote],
                ["card", "فيزا (مكنة العيادة)", CreditCard],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                aria-pressed={method === value}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border bg-card p-3 font-semibold transition-colors",
                  method === value &&
                    "border-primary bg-accent/50 ring-1 ring-primary",
                )}
              >
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>

          <Button size="lg" onClick={book} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {pending
              ? "جاري الحجز…"
              : `احجز · ${formatMoney(doctor.doctors.consultation_fee)}`}
          </Button>
        </section>
      )}
    </div>
  );
}
