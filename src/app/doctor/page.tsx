// =====================================================================
// صفحة "مرضى النهارده": /doctor
// Server Component: بيجيب حجوزات النهارده بتوكن الدكتور (D1).
// الـ RLS بترجّع حجوزاته هو بس، والملغي مش بيظهر.
// =====================================================================

import { CalendarCheck, Clock, UserCheck, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api-messages";
import { doctorApi, visitPerson } from "@/lib/doctor-api";
import { cairoToday, formatDay } from "@/lib/dates";
import { GENDER_LABEL, NONE, ageFromDob, formatTime } from "@/lib/format";
import type { DoctorVisit } from "@/types/doctor";
import { PageTitle } from "@/components/coming-next";
import { AttendButton } from "@/components/doctor/attend-button";
import { VisitDialog } from "@/components/doctor/visit-dialog";
import { PrescriptionButton } from "@/components/prescription-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** الحالة اللي بتظهر للدكتور */
function statusOf(v: DoctorVisit) {
  if (v.status === "attended" && v.diagnosis)
    return { label: "تم الكشف", variant: "default" as const };
  if (v.status === "attended")
    return { label: "حضر", variant: "secondary" as const };
  return { label: "في الانتظار", variant: "outline" as const };
}

export default async function DoctorHome() {
  const user = await requireRole("doctor");
  const today = cairoToday();

  let visits: DoctorVisit[] = [];
  let error: string | undefined;
  try {
    visits = await doctorApi.dayVisits(user.token, today);
  } catch (err) {
    error = authErrorMessage(err);
  }

  const attended = visits.filter((v) => v.status === "attended").length;

  return (
    <>
      <PageTitle title="مرضى اليوم" subtitle={formatDay(today)} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="حجوزات اليوم" value={visits.length} />
        <StatCard icon={UserCheck} label="حضروا" value={attended} />
        <StatCard
          icon={Clock}
          label="في الانتظار"
          value={visits.length - attended}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && visits.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-xl border border-dashed bg-card p-10 text-center">
          <CalendarCheck className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد حجوزات اليوم</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموعد</TableHead>
                <TableHead>المريض</TableHead>
                <TableHead>السن والنوع</TableHead>
                <TableHead>مرض مزمن</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الكشف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((v) => {
                const person = visitPerson(v);
                const status = statusOf(v);
                const p = v.patient;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap font-semibold">
                      {formatTime(v.start_time)} – {formatTime(v.end_time)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{person.name}</div>
                      <div
                        dir="ltr"
                        className="text-end text-xs text-muted-foreground"
                      >
                        {person.phone}
                      </div>
                      {!person.hasAccount && (
                        <Badge variant="secondary" className="mt-1">
                          بدون حساب · وصفة ورقية
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p?.date_of_birth
                        ? `${ageFromDob(p.date_of_birth)} سنة`
                        : "—"}
                      {p?.gender ? ` · ${GENDER_LABEL[p.gender]}` : ""}
                    </TableCell>
                    <TableCell>
                      {p ? (p.chronic_disease ?? NONE) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {v.status === "booked" ? (
                        <AttendButton appointmentId={v.id} />
                      ) : (
                        <div className="flex flex-wrap items-start gap-2">
                          <VisitDialog visit={v} doctorId={user.id} />
                          {v.prescription_path && (
                            <PrescriptionButton path={v.prescription_path} />
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
