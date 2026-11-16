"use client";

// =====================================================================
// شباك "الكشف": التشخيص، ورفع الروشتة للمريض اللي عنده حساب.
// بيكلم بالترتيب:
//   1. POST /storage/v1/object/prescriptions/<doctor>/<appointment>.<ext>  (لو فيه ملف)
//   2. POST /rest/v1/rpc/record_visit
// =====================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FilePen, FileCheck2, Upload } from "lucide-react";
import { authErrorMessage } from "@/lib/api-messages";
import {
  PRESCRIPTION_MAX_BYTES,
  PRESCRIPTION_TYPES,
  doctorApi,
  doctorErrorMessage,
  visitPerson,
} from "@/lib/doctor-api";
import { getAccessToken } from "@/lib/session";
import type { DoctorVisit } from "@/types/doctor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = { visit: DoctorVisit; doctorId: string };

export function VisitDialog({ visit, doctorId }: Props) {
  const router = useRouter();
  const person = visitPerson(visit);
  const done = visit.diagnosis !== null; // اتكتب تشخيص قبل كده

  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setError(undefined);
      setFile(null);
      setDiagnosis(visit.diagnosis ?? "");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(undefined);
    if (f && !PRESCRIPTION_TYPES[f.type]) {
      e.target.value = "";
      return setError("يجب أن تكون الوصفة الطبية ملف PDF أو صورة JPG أو PNG");
    }
    if (f && f.size > PRESCRIPTION_MAX_BYTES) {
      e.target.value = "";
      return setError("حجم الوصفة الطبية أكبر من 5 ميجابايت");
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (diagnosis.trim().length < 3)
      return setError("اكتب التشخيص (3 أحرف على الأقل)");
    const token = getAccessToken();
    if (!token) return setError("انتهت الجلسة، أعد تحميل الصفحة");

    setPending(true);
    setError(undefined);
    try {
      // 1. الملف الأول، علشان record_visit بتتأكد إنه اترفع
      const path = file
        ? await doctorApi.uploadPrescription(token, doctorId, visit.id, file)
        : undefined;
      // 2. التشخيص والمسار
      await doctorApi.recordVisit(token, visit.id, diagnosis.trim(), path);
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(doctorErrorMessage(err, authErrorMessage));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={done ? "outline" : "default"}>
          <FilePen /> {done ? "تعديل الكشف" : "الكشف"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>كشف {person.name}</DialogTitle>
          <DialogDescription>
            {person.hasAccount
              ? "اكتب التشخيص، وارفع الوصفة الطبية ليتمكن المريض من تحميلها من حسابه."
              : "هذا المريض ليس لديه حساب على الموقع، لذا تكون الوصفة ورقية. اكتب التشخيص فقط."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="diagnosis">التشخيص</Label>
            <textarea
              id="diagnosis"
              rows={4}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              disabled={pending}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="مثال: التهاب في الحلق، راحة وسوائل دافئة"
            />
          </div>

          {person.hasAccount && (
            <div className="grid gap-2">
              <Label htmlFor="prescription">
                الوصفة الطبية (PDF أو صورة، 5 ميجابايت كحد أقصى)
              </Label>
              {visit.prescription_path && !file && (
                <p className="flex items-center gap-1.5 text-sm text-primary">
                  <FileCheck2 className="size-4" /> توجد وصفة مرفوعة. إذا رفعت وصفة جديدة فستحل محلها.
                </p>
              )}
              <input
                id="prescription"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={onFile}
                disabled={pending}
                className="text-sm file:me-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={pending}>
            <Upload />{" "}
            {pending ? (file ? "جارٍ رفع الوصفة…" : "جارٍ الحفظ…") : "حفظ الكشف"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
