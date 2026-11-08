import { requireRole } from "@/lib/auth";
import { adminApi } from "@/lib/admin-api";
import { DAY_NAMES, formatMoney, formatTime } from "@/lib/format";
import { authErrorMessage } from "@/lib/api-messages";
import { PageTitle } from "@/components/coming-next";
import { AddStaffDialog } from "@/components/admin/add-staff-dialog";
import { StaffActions } from "@/components/admin/staff-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DoctorRow } from "@/types/admin";
import { DoctorDetailsDialog } from "@/components/admin/doctor-details-dialog";

export default async function AdminDoctors() {
  const user = await requireRole("admin");

  let doctors: DoctorRow[] = [];
  let error: string | undefined;
  try {
    // GET /rest/v1/profiles?select=...,doctors(...,doctor_schedules(...))&role=eq.doctor
    doctors = await adminApi.listDoctors(user.token);
  } catch (e) {
    error = authErrorMessage(e);
  }

  const active = doctors.filter((d) => d.is_active).length;
  const incomplete = doctors.filter((d) => !d.doctors).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          title="الدكاترة"
          subtitle={`${doctors.length} دكتور، منهم ${active} شغال`}
        />
        <AddStaffDialog role="doctor" />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {incomplete > 0 && (
        <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-900">
          <AlertDescription className="text-amber-900">
            فيه {incomplete} دكتور ناقص بياناته (التخصص والسعر والمواعيد)، ومحدش
            يقدر يحجز عنده لحد ما تكمّلها.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden py-0">
        {doctors.length === 0 ? (
          <CardContent className="py-12 text-center text-muted-foreground">
            لسه مفيش دكاترة.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>الدكتور</TableHead>
                <TableHead>التخصص</TableHead>
                <TableHead>سعر الكشف</TableHead>
                <TableHead>مواعيد العمل</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((d) => (
                <TableRow
                  key={d.id}
                  className={d.is_active ? "" : "opacity-60"}
                >
                  {/* الاسم، وتحته الأيميل والموبايل */}
                  <TableCell>
                    <p className="font-semibold">{d.full_name}</p>
                    <p
                      dir="ltr"
                      className="text-end text-xs text-muted-foreground"
                    >
                      {d.email} · {d.phone}
                    </p>
                  </TableCell>

                  {d.doctors ? (
                    <>
                      <TableCell>{d.doctors.specialty}</TableCell>
                      <TableCell>
                        <p className="font-semibold">
                          {formatMoney(d.doctors.consultation_fee)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.doctors.slot_minutes} دقيقة · العيادة{" "}
                          {d.doctors.clinic_share_percent}%
                        </p>
                      </TableCell>
                      <TableCell className="text-xs leading-6">
                        {d.doctors.doctor_schedules.length === 0 ? (
                          <span className="text-muted-foreground">
                            مفيش مواعيد
                          </span>
                        ) : (
                          d.doctors.doctor_schedules.map((s) => (
                            <p key={s.day_of_week}>
                              <span className="font-semibold">
                                {DAY_NAMES[s.day_of_week]}
                              </span>{" "}
                              {formatTime(s.start_time)} –{" "}
                              {formatTime(s.end_time)}
                            </p>
                          ))
                        )}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell colSpan={3}>
                      <Badge
                        variant="outline"
                        className="border-amber-400 text-amber-700"
                      >
                        ناقص بياناته
                      </Badge>
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge variant={d.is_active ? "default" : "secondary"}>
                      {d.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <DoctorDetailsDialog doctor={d} />
                      <StaffActions member={d} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
