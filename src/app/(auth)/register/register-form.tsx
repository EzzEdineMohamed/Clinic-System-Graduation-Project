"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { saveSession } from "@/lib/session";
import type { Session } from "@/types/auth";
import { ROLE_HOME } from "@/lib/roles";
import { registerSchema, fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const DUPLICATE_EMAIL = "للأسف الأيميل ده متسجل قبل كده، مينفعش تسجل بيه تاني. جرب تسجل دخول.";
const DUPLICATE_PHONE = "رقم الموبايل ده متسجل قبل كده، مينفعش تعمل بيه حساب جديد. لو ده رقمك كلّم العيادة.";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [fe, setFe] = useState<FieldErrors>({});
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));

    // 1. validate in the browser first
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);
    setPending(true);

    const { email, password, full_name, phone, gender, date_of_birth, chronic_disease } = parsed.data;
    try {
      // 2. POST /rest/v1/rpc/is_phone_registered — one patient per mobile number
      if (await api.isPhoneRegistered(phone)) {
        setFe({ phone: [DUPLICATE_PHONE] });
        setPending(false);
        return;
      }

      // 3. POST /auth/v1/signup — the role is NOT sent: the database makes every sign-up a patient
      const res = await api.signup({ email, password, data: { full_name, phone, gender, date_of_birth, chronic_disease } });

      if (res.access_token) {
        // email confirmation is off → logged in right away
        saveSession(res as Session);
        router.replace(ROLE_HOME.patient);
        router.refresh();
        return;
      }
      // email confirmation is on: Supabase hides duplicates as a user with no identities
      if (res.identities?.length === 0) {
        setFe({ email: [DUPLICATE_EMAIL] });
      } else {
        setSuccess("اتبعتلك رسالة على الأيميل، أكد الحساب منها وبعدين سجل دخول.");
      }
      setPending(false);
    } catch (err) {
      if (err instanceof ApiError && (err.code === "user_already_exists" || err.code === "email_exists")) {
        setFe({ email: [DUPLICATE_EMAIL] });
      } else if (err instanceof ApiError && err.code === "weak_password") {
        setFe({ password: ["الباسوورد ضعيف، استخدم حروف وأرقام"] });
      } else {
        setError(authErrorMessage(err));
      }
      setPending(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success">
        <CheckCircle2 />
        <AlertDescription>
          {success}{" "}
          <Link href="/login" className="font-bold underline">
            تسجيل الدخول
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} method="post" className="grid gap-5" noValidate>
      <fieldset disabled={pending} className="contents">
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Field>
          <Label htmlFor="full_name">الاسم بالكامل</Label>
          <Input id="full_name" name="full_name" autoComplete="name" aria-invalid={!!fe.full_name} />
          <FieldError errors={fe.full_name} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="email">الأيميل</Label>
            <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!fe.email} />
            <FieldError errors={fe.email} />
          </Field>
          <Field>
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input id="phone" name="phone" type="tel" dir="ltr" inputMode="numeric" autoComplete="tel" placeholder="01xxxxxxxxx" aria-invalid={!!fe.phone} />
            <FieldError errors={fe.phone} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="password">الباسوورد</Label>
            <Input id="password" name="password" type="password" dir="ltr" autoComplete="new-password" aria-invalid={!!fe.password} />
            <FieldError errors={fe.password} />
          </Field>
          <Field>
            <Label htmlFor="confirm_password">تأكيد الباسوورد</Label>
            <Input id="confirm_password" name="confirm_password" type="password" dir="ltr" autoComplete="new-password" aria-invalid={!!fe.confirm_password} />
            <FieldError errors={fe.confirm_password} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <Label>النوع</Label>
            <RadioGroup name="gender" className="flex h-10 items-center gap-6" aria-invalid={!!fe.gender}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="male" /> ذكر
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="female" /> أنثى
              </label>
            </RadioGroup>
            <FieldError errors={fe.gender} />
          </Field>
          <Field>
            <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" max={today} aria-invalid={!!fe.date_of_birth} />
            <FieldError errors={fe.date_of_birth} />
          </Field>
        </div>

        <Field>
          <Label htmlFor="chronic_disease">
            مرض مزمن <span className="font-normal text-muted-foreground">(اختياري)</span>
          </Label>
          <Input id="chronic_disease" name="chronic_disease" placeholder="مثلاً: سكر، ضغط" aria-invalid={!!fe.chronic_disease} />
          <FieldHint>سيبها فاضية لو مفيش</FieldHint>
          <FieldError errors={fe.chronic_disease} />
        </Field>

        <SubmitButton size="lg" pending={pending} pendingText="جاري إنشاء الحساب…" className="mt-2">
          إنشاء الحساب
        </SubmitButton>

        <p className="text-center text-sm text-muted-foreground">
          عندك حساب؟{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            سجل دخول
          </Link>
        </p>
      </fieldset>
    </form>
  );
}
