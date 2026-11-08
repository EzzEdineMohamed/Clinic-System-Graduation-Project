"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Stethoscope } from "lucide-react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { authErrorMessage } from "@/lib/api-messages";
import { getAccessToken } from "@/lib/session";
import { DAY_NAMES } from "@/lib/format";
import { doctorDetailsSchema } from "@/lib/validation/admin";
import { fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import type { DoctorRow, ScheduleDay } from "@/types/admin";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** يوم واحد في الفورم: شغال فيه ولا لأ، ومن إمتى لإمتى */
interface DayForm {
  on: boolean;
  start: string; // "19:00"
  end: string;
}

/** "19:30" → 1170 دقيقة من أول اليوم */
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** الأيام السبعة بالمواعيد المحفوظة، والباقي مقفول */
function initialDays(doctor: DoctorRow): DayForm[] {
  const saved = doctor.doctors?.doctor_schedules ?? [];
  return DAY_NAMES.map((_, i) => {
    const s = saved.find((d) => d.day_of_week === i);
    return s
      ? {
          on: true,
          start: s.start_time.slice(0, 5),
          end: s.end_time.slice(0, 5),
        }
      : { on: false, start: "10:00", end: "14:00" };
  });
}

export function DoctorDetailsDialog({ doctor }: { doctor: DoctorRow }) {
  const router = useRouter();
  const info = doctor.doctors; // null لو ناقص بياناته

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fe, setFe] = useState<FieldErrors>({});
  const [days, setDays] = useState<DayForm[]>(() => initialDays(doctor));
  const [slot, setSlot] = useState(info?.slot_minutes ?? 20);

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (next) {
      // كل ما يفتح، يبدأ من البيانات المحفوظة مش من آخر حاجة اتكتبت
      setDays(initialDays(doctor));
      setSlot(info?.slot_minutes ?? 20);
    } else {
      setError(undefined);
      setFe({});
    }
  }

  /** عدّل يوم واحد من غير ما تلمس الباقيين */
  function setDay(i: number, changes: Partial<DayForm>) {
    setDays((prev) => prev.map((d, j) => (j === i ? { ...d, ...changes } : d)));
  }

  /** فيه مشكلة في اليوم ده؟ */
  function dayProblem(d: DayForm): string | undefined {
    if (!d.on) return;
    if (!d.start || !d.end) return "اكتب البداية والنهاية";
    const length = toMinutes(d.end) - toMinutes(d.start);
    if (length <= 0) return "النهاية لازم تبقى بعد البداية";
    if (slot >= 5 && length < slot) return "الفترة أقصر من مدة الكشف";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 1. الخانات الأربعة بـ zod، والأيام بإيدينا
    const parsed = doctorDetailsSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    const errors: FieldErrors = parsed.success
      ? {}
      : fieldErrorsOf(parsed.error);
    if (!days.some((d) => d.on))
      errors.schedule = ["اختار يوم شغل واحد على الأقل"];
    else if (days.some((d) => dayProblem(d)))
      errors.schedule = ["فيه يوم مواعيده غلط، صلّحه الأول"];
    setFe(errors);
    if (!parsed.success || errors.schedule) return;
    setError(undefined);

    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني");

    // 2. الأيام المعلّم عليها بس، بالشكل اللي الداتابيز مستنياه
    const schedule: ScheduleDay[] = days.flatMap((d, i) =>
      d.on ? [{ day_of_week: i, start_time: d.start, end_time: d.end }] : [],
    );

    setPending(true);
    try {
      // 3. POST /rest/v1/rpc/admin_save_doctor
      await adminApi.saveDoctor(token, {
        p_doctor_id: doctor.id,
        p_specialty: parsed.data.specialty,
        p_consultation_fee: parsed.data.consultation_fee,
        p_clinic_share_percent: parsed.data.clinic_share_percent,
        p_slot_minutes: parsed.data.slot_minutes,
        p_schedule: schedule,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      // P0001 = raise exception بتاعتنا، و 42501 = require_admin، والاتنين رسايلهم عربي
      const ours =
        err instanceof ApiError &&
        (err.code === "P0001" || err.code === "42501");
      setError(ours ? (err as ApiError).message : authErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={info ? "ghost" : "outline"}
          size="sm"
          className={
            info ? "" : "border-amber-400 text-amber-700 hover:text-amber-800"
          }
        >
          <Stethoscope /> {info ? "بيانات الكشف" : "كمّل البيانات"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>بيانات الكشف: {doctor.full_name}</DialogTitle>
          <DialogDescription>
            التخصص والسعر ومواعيد الشغل اللي المرضى هيحجزوا فيها.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          method="post"
          noValidate
          className="grid gap-5"
        >
          <fieldset disabled={pending} className="contents">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* --- بيانات الكشف --- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <Label htmlFor="specialty">التخصص</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={info?.specialty}
                  placeholder="باطنة، أطفال، جلدية…"
                  aria-invalid={!!fe.specialty}
                />
                <FieldError errors={fe.specialty} />
              </Field>
              <Field>
                <Label htmlFor="consultation_fee">سعر الكشف (ج.م)</Label>
                <Input
                  id="consultation_fee"
                  name="consultation_fee"
                  type="number"
                  min={1}
                  dir="ltr"
                  defaultValue={info?.consultation_fee}
                  aria-invalid={!!fe.consultation_fee}
                />
                <FieldError errors={fe.consultation_fee} />
              </Field>
              <Field>
                <Label htmlFor="slot_minutes">مدة الكشف (دقيقة)</Label>
                <Input
                  id="slot_minutes"
                  name="slot_minutes"
                  type="number"
                  min={5}
                  max={120}
                  dir="ltr"
                  value={slot}
                  onChange={(e) => setSlot(Number(e.target.value))}
                  aria-invalid={!!fe.slot_minutes}
                />
                <FieldError errors={fe.slot_minutes} />
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor="clinic_share_percent">نسبة العيادة (%)</Label>
                <Input
                  id="clinic_share_percent"
                  name="clinic_share_percent"
                  type="number"
                  min={0}
                  max={100}
                  dir="ltr"
                  defaultValue={info?.clinic_share_percent ?? 30}
                  aria-invalid={!!fe.clinic_share_percent}
                />
                <FieldHint>
                  الدكتور بياخد الباقي. الحجوزات القديمة بتفضل بالنسبة اللي
                  اتحجزت بيها.
                </FieldHint>
                <FieldError errors={fe.clinic_share_percent} />
              </Field>
            </div>

            {/* --- مواعيد الشغل --- */}
            <div className="grid gap-2">
              <Label>مواعيد الشغل</Label>
              <div className="divide-y rounded-lg border">
                {days.map((d, i) => {
                  const problem = dayProblem(d);
                  const count =
                    d.on && !problem
                      ? Math.floor(
                          (toMinutes(d.end) - toMinutes(d.start)) / slot,
                        )
                      : 0;
                  return (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
                    >
                      <label className="flex w-28 cursor-pointer items-center gap-2 font-medium">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={d.on}
                          onChange={(e) => setDay(i, { on: e.target.checked })}
                        />
                        {DAY_NAMES[i]}
                      </label>

                      {d.on ? (
                        <>
                          <span className="text-sm text-muted-foreground">
                            من
                          </span>
                          <Input
                            type="time"
                            dir="ltr"
                            className="h-8 w-32"
                            value={d.start}
                            onChange={(e) =>
                              setDay(i, { start: e.target.value })
                            }
                            aria-invalid={!!problem}
                          />
                          <span className="text-sm text-muted-foreground">
                            لـ
                          </span>
                          <Input
                            type="time"
                            dir="ltr"
                            className="h-8 w-32"
                            value={d.end}
                            onChange={(e) => setDay(i, { end: e.target.value })}
                            aria-invalid={!!problem}
                          />
                          <span
                            className={`text-xs ${problem ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {problem ?? `${count} كشف`}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          إجازة
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <FieldError errors={fe.schedule} />
            </div>

            <SubmitButton pending={pending} pendingText="جاري الحفظ…">
              حفظ
            </SubmitButton>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
