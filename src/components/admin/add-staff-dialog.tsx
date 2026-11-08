"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { authErrorMessage } from "@/lib/api-messages";
import { getAccessToken } from "@/lib/session";
import { staffSchema } from "@/lib/validation/admin";
import { fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import type { StaffRole } from "@/types/admin";
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

const LABEL: Record<StaffRole, string> = { nurse: "سكرتيرة", doctor: "دكتور" };

export function AddStaffDialog({ role }: { role: StaffRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fe, setFe] = useState<FieldErrors>({});

  function onOpenChange(next: boolean) {
    if (pending) return; // متقفلش الـ Dialog والطلب لسه شغال
    setOpen(next);
    if (!next) {
      setError(undefined);
      setFe({});
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // 1. الـ Validation في المتصفح الأول
    const parsed = staffSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);

    // 2. توكن الأدمن من الكوكي
    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني");

    setPending(true);
    try {
      // 3. POST /functions/v1/create-staff
      await adminApi.createStaff(token, { ...parsed.data, role });
      setOpen(false);
      router.refresh(); // السيرفر يجيب اللستة من جديد
    } catch (err) {
      if (err instanceof ApiError && err.code === "email_exists") {
        setFe({ email: ["الأيميل ده متسجل قبل كده"] });
      } else if (
        err instanceof ApiError &&
        err.code === "validation_failed" &&
        err.fields
      ) {
        // { email: "..." } → { email: ["..."] }
        setFe(
          Object.fromEntries(
            Object.entries(err.fields).map(([k, v]) => [k, [v]]),
          ),
        );
      } else if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        setError(err.message);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> إضافة {LABEL[role]}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة {LABEL[role]} جديد</DialogTitle>
          <DialogDescription>
            هيقدر يدخل بالأيميل والباسوورد دول على طول.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          method="post"
          noValidate
          className="grid gap-4"
        >
          <fieldset disabled={pending} className="contents">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Field>
              <Label htmlFor="full_name">الاسم بالكامل</Label>
              <Input
                id="full_name"
                name="full_name"
                aria-invalid={!!fe.full_name}
              />
              <FieldError errors={fe.full_name} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="email">الأيميل</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  aria-invalid={!!fe.email}
                />
                <FieldError errors={fe.email} />
              </Field>
              <Field>
                <Label htmlFor="phone">رقم الموبايل</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="01xxxxxxxxx"
                  aria-invalid={!!fe.phone}
                />
                <FieldError errors={fe.phone} />
              </Field>
            </div>

            <Field>
              <Label htmlFor="password">الباسوورد</Label>
              <Input
                id="password"
                name="password"
                type="text"
                dir="ltr"
                autoComplete="off"
                aria-invalid={!!fe.password}
              />
              <FieldHint>
                8 حروف على الأقل. ابعتها للموظف علشان يدخل بيها.
              </FieldHint>
              <FieldError errors={fe.password} />
            </Field>

            <SubmitButton
              pending={pending}
              pendingText="جاري الإضافة…"
              className="mt-2 cursor-pointer"
            >
              إضافة
            </SubmitButton>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
