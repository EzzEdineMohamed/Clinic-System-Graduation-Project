"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { authErrorMessage } from "@/lib/api-messages";
import { saveSession, clearSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";
import { loginSchema, fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(notice);
  const [fe, setFe] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    // 1. validate in the browser first
    const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);
    setPending(true);

    try {
      // 2. POST /auth/v1/token?grant_type=password
      const session = await api.login(parsed.data.email, parsed.data.password);
      saveSession(session);

      // 3. POST /rest/v1/rpc/get_my_profile → which role?
      const me = await api.me(session.access_token);
      if (!me || !me.is_active) {
        await api.logout(session.access_token).catch(() => {});
        clearSession();
        setError("الحساب ده موقوف، كلم إدارة العيادة");
        setPending(false);
        return;
      }

      // 4. go to that role's page (keep the spinner until it opens)
      router.replace(ROLE_HOME[me.role]);
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(false);
    }
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
          <Label htmlFor="email">الأيميل</Label>
          <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" aria-invalid={!!fe.email} />
          <FieldError errors={fe.email} />
        </Field>

        <Field>
          <Label htmlFor="password">الباسوورد</Label>
          <Input id="password" name="password" type="password" dir="ltr" autoComplete="current-password" aria-invalid={!!fe.password} />
          <FieldError errors={fe.password} />
        </Field>

        <SubmitButton size="lg" pending={pending} pendingText="جاري تسجيل الدخول…" className="mt-2">
          تسجيل الدخول
        </SubmitButton>

        <p className="text-center text-sm text-muted-foreground">
          مريض جديد؟{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            اعمل حساب
          </Link>
        </p>
      </fieldset>
    </form>
  );
}
