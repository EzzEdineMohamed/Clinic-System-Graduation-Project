"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { authErrorMessage } from "@/lib/api-messages";
import { getAccessToken } from "@/lib/session";
import { staffSchema } from "@/lib/validation/admin";
import { fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import type { StaffMember } from "@/types/admin";
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

// نفس قاعدة الباسوورد بتاعة "إضافة موظف"
const passwordSchema = staffSchema.pick({ password: true });

export function ChangePassword({ member }: { member: StaffMember }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>(); // رسالة النجاح من السيرفر
  const [fe, setFe] = useState<FieldErrors>({});

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setError(undefined);
      setDone(undefined);
      setFe({});
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);

    const token = getAccessToken();
    if (!token) return setError("الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني");

    setPending(true);
    try {
      // POST /functions/v1/set-staff-password
      const res = await adminApi.setStaffPassword(
        token,
        member.id,
        parsed.data.password,
      );
      setDone(res.message);
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code === "validation_failed" &&
        err.fields
      ) {
        setFe(
          Object.fromEntries(
            Object.entries(err.fields).map(([k, v]) => [k, [v]]),
          ),
        );
      } else if (
        err instanceof ApiError &&
        [401, 403, 404, 422].includes(err.status)
      ) {
        setError(err.message); // رسايل الـ Function عربي أصلاً
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
        <Button variant="ghost" size="sm">
          <KeyRound /> الباسوورد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>باسوورد جديد لـ {member.full_name}</DialogTitle>
          <DialogDescription dir="ltr" className="text-start">
            {member.email}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="grid gap-4">
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>{done}</AlertDescription>
            </Alert>
            <Button onClick={() => onOpenChange(false)}>تمام</Button>
          </div>
        ) : (
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
                <Label htmlFor={`password-${member.id}`}>
                  الباسوورد الجديد
                </Label>
                <Input
                  id={`password-${member.id}`}
                  name="password"
                  type="text"
                  dir="ltr"
                  autoComplete="off"
                  aria-invalid={!!fe.password}
                />
                <FieldHint>
                  8 حروف على الأقل. الباسوورد القديم هيبطل يشتغل على طول.
                </FieldHint>
                <FieldError errors={fe.password} />
              </Field>
              <SubmitButton pending={pending} pendingText="جاري التغيير…">
                غيّر الباسوورد
              </SubmitButton>
            </fieldset>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
