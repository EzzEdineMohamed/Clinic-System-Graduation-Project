"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Pencil, Power, PowerOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import { adminApi } from "@/lib/admin-api";
import { authErrorMessage } from "@/lib/api-messages";
import { getAccessToken } from "@/lib/session";
import { staffUpdateSchema } from "@/lib/validation/admin";
import { fieldErrorsOf, type FieldErrors } from "@/lib/validation/auth";
import type { StaffMember, StaffUpdate } from "@/types/admin";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChangePassword } from "./change-password";

// ---------- PATCH مشترك للتعديل والإيقاف --------------------------------

/** بيبعت التعديل، ويرجع رسالة خطأ بالعربي، أو null لو نجح */
async function patchStaff(
  id: string,
  changes: StaffUpdate,
): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return "الجلسة خلصت، اعمل Refresh للصفحة وجرب تاني";
  try {
    await adminApi.updateStaff(token, id, changes);
    return null;
  } catch (err) {
    // 23514 = check constraint في الداتابيز (رقم الموبايل مش مصري)
    if (err instanceof ApiError && err.code === "23514")
      return "رقم الموبايل مش صحيح";
    // 403 أو 42501 = الـ RLS أو الـ Trigger رفض، ورسالته عربي أصلاً
    if (err instanceof ApiError && (err.status === 403 || err.code === "42501"))
      return err.message;
    return authErrorMessage(err);
  }
}

// ---------- زرار التعديل -------------------------------------------------

function EditStaff({ member }: { member: StaffMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fe, setFe] = useState<FieldErrors>({});

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setError(undefined);
      setFe({});
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = staffUpdateSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!parsed.success) return setFe(fieldErrorsOf(parsed.error));
    setFe({});
    setError(undefined);

    setPending(true);
    const err = await patchStaff(member.id, parsed.data);
    setPending(false);
    if (err) return setError(err);

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil /> تعديل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل بيانات {member.full_name}</DialogTitle>
          <DialogDescription dir="ltr" className="text-start">
            {member.email}
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
              <Label htmlFor={`name-${member.id}`}>الاسم بالكامل</Label>
              <Input
                id={`name-${member.id}`}
                name="full_name"
                defaultValue={member.full_name}
                aria-invalid={!!fe.full_name}
              />
              <FieldError errors={fe.full_name} />
            </Field>
            <Field>
              <Label htmlFor={`phone-${member.id}`}>رقم الموبايل</Label>
              <Input
                id={`phone-${member.id}`}
                name="phone"
                type="tel"
                dir="ltr"
                inputMode="numeric"
                defaultValue={member.phone}
                aria-invalid={!!fe.phone}
              />
              <FieldError errors={fe.phone} />
            </Field>
            <SubmitButton
              pending={pending}
              pendingText="جاري الحفظ…"
              className="mt-2"
            >
              حفظ التعديل
            </SubmitButton>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- زرار الإيقاف / التفعيل ---------------------------------------

function ToggleActive({ member }: { member: StaffMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const stopping = member.is_active; // لو شغال يبقى الزرار هيوقفه

  async function onConfirm(e: React.MouseEvent) {
    e.preventDefault(); // متقفلش النافذة لحد ما الطلب يخلص
    setPending(true);
    setError(undefined);
    const err = await patchStaff(member.id, { is_active: !member.is_active });
    setPending(false);
    if (err) return setError(err);
    setOpen(false);
    router.refresh();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !pending && (setOpen(next), setError(undefined))}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={
            stopping
              ? "text-destructive hover:text-destructive"
              : "text-success hover:text-success"
          }
        >
          {stopping ? <PowerOff /> : <Power />}
          {stopping ? "إيقاف" : "تفعيل"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {stopping ? "إيقاف" : "تفعيل"} حساب {member.full_name}؟
          </AlertDialogTitle>
          <AlertDialogDescription>
            {stopping
              ? "مش هيقدر يدخل الموقع لحد ما تفعّله تاني. حسابه وسجله القديم مش هيتمسحوا."
              : "هيقدر يدخل تاني بنفس الأيميل والباسوورد."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>رجوع</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className={
              stopping
                ? "bg-destructive text-white hover:bg-destructive/90"
                : ""
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            {stopping ? "إيقاف" : "تفعيل"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- اللي بيتحط في الجدول -----------------------------------------

export function StaffActions({ member }: { member: StaffMember }) {
  return (
    <div className="flex justify-end gap-1">
      <EditStaff member={member} />
      <ChangePassword member={member} />
      <ToggleActive member={member} />
    </div>
  );
}
