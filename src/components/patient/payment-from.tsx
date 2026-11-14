"use client";

// =====================================================================
// فورم الدفع (بوابة وهمية في وضع التجربة).
// بيكلم: POST /rest/v1/rpc/book_appointment
// الحجز والدفع بيتعملوا مع بعض في الباك أند، يا الاتنين يا ولا حاجة.
// =====================================================================

import { useState } from "react";
import { AlertCircle, CreditCard, FlaskConical } from "lucide-react";
import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import { formatMoney } from "@/lib/format";
import { getAccessToken } from "@/lib/session";
import { cardSchema } from "@/lib/validation/booking";
import { fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import type { BookResult, BookableDoctor, Slot } from "@/types/booking";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** "4242424242424242" → "4242 4242 4242 4242" وهو بيكتب */
function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1228" → "12/28" وهو بيكتب */
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

type Props = {
  doctor: BookableDoctor;
  date: string;
  slot: Slot;
  onBooked: (result: BookResult) => void; // الحجز نجح
  onSlotTaken: (message: string) => void; // حد سبقه للميعاد
};

export function PaymentForm({
  doctor,
  date,
  slot,
  onBooked,
  onSlotTaken,
}: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fe, setFe] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 1) شكل البيانات
    const parsed = cardSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);

    // 2) التوكن
    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني");

    // 3) الحجز والدفع
    setPending(true);
    try {
      const result = await bookingApi.book(token, {
        p_doctor_id: doctor.id,
        p_date: date,
        p_start_time: slot.start_time.slice(0, 5), // "19:00:00" → "19:00"
        p_card_number: parsed.data.card_number,
      });
      onBooked(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === "P0001") {
        if (err.message.includes("البطاقة"))
          setFe({ card_number: [err.message] }); // مرفوضة أو غلط
        else if (err.message.includes("اتحجز خلاص"))
          onSlotTaken(err.message); // حد سبقه
        else setError(err.message); // حجز تاني في نفس اليوم، أو أي رسالة تانية
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      method="post"
      noValidate
      className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6"
    >
      <fieldset disabled={pending} className="contents">
        <p className="flex items-center gap-2 font-bold">
          <CreditCard className="size-5 text-primary" /> الدفع بالفيزا
        </p>

        {/* <Alert>
          <FlaskConical />
          <AlertDescription>
            وضع التجربة، مفيش فلوس حقيقية بتتخصم. استخدم
            <span dir="ltr" className="font-mono font-semibold">
              4242 4242 4242 4242
            </span>
            للنجاح، أو
            <span dir="ltr" className="font-mono font-semibold">
              4000 0000 0000 0002
            </span>
            للرفض، وأي تاريخ جاي وأي 3 أرقام.
          </AlertDescription>
        </Alert> */}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Field>
          <Label htmlFor="card_number">رقم البطاقة</Label>
          <Input
            id="card_number"
            name="card_number"
            inputMode="numeric"
            autoComplete="cc-number"
            dir="ltr"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCard(e.target.value))}
            aria-invalid={!!fe.card_number}
          />
          <FieldError errors={fe.card_number} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="expiry">تاريخ الانتهاء</Label>
            <Input
              id="expiry"
              name="expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              dir="ltr"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              aria-invalid={!!fe.expiry}
            />
            <FieldError errors={fe.expiry} />
          </Field>
          <Field>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              name="cvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              dir="ltr"
              maxLength={3}
              placeholder="123"
              aria-invalid={!!fe.cvv}
            />
            <FieldError errors={fe.cvv} />
          </Field>
        </div>

        <SubmitButton pending={pending} pendingText="جاري الدفع…" size="lg">
          ادفع واحجز · {formatMoney(doctor.doctors.consultation_fee)}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
