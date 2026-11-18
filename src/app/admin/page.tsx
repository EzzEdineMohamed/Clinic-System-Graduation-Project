// =====================================================================
// لوحة التحكم: /admin
// Server Component: بيجيب أرقام العيادة من admin_dashboard بتوكن الأدمن.
// الشهر من الـ URL (?month=2026-11)، ولو مش موجود: الشهر الحالي.
// =====================================================================

import {
  Ban,
  CalendarCheck,
  CalendarDays,
  Clock,
  Landmark,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminApi } from "@/lib/admin-api";
import { authErrorMessage } from "@/lib/api-messages";
import { cairoToday } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { AdminDashboard } from "@/types/admin";
import { PageTitle } from "@/components/coming-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-2xl font-extrabold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function monthLabel(firstDay: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${firstDay}T00:00:00Z`));
}

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<"/admin">) {
  const user = await requireRole("admin");
  const { month: raw } = await searchParams;
  const month =
    typeof raw === "string" && /^\d{4}-\d{2}$/.test(raw)
      ? raw
      : cairoToday().slice(0, 7);

  let data: AdminDashboard | null = null;
  let error: string | undefined;
  try {
    data = await adminApi.dashboard(user.token, month);
  } catch (err) {
    error = authErrorMessage(err);
  }

  return (
    <>
      <PageTitle
        title="لوحة التحكم"
        subtitle="ملخص العيادة اليوم، والحجوزات والإيرادات خلال الشهر"
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold">اليوم</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={CalendarCheck}
                label="حجوزات اليوم"
                value={data.today.bookings}
              />
              <StatCard
                icon={UserCheck}
                label="تم الكشف"
                value={data.today.attended}
              />
              <StatCard
                icon={Clock}
                label="في الانتظار"
                value={data.today.waiting}
              />
              <StatCard
                icon={Users}
                label="المرضى المسجلون"
                value={data.counts.patients}
              />
              <StatCard
                icon={Stethoscope}
                label="الأطباء النشطون"
                value={data.counts.doctors}
              />
              <StatCard
                icon={UserRound}
                label="السكرتارية النشطة"
                value={data.counts.nurses}
              />
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-lg font-bold">
                شهر {monthLabel(data.month)}
              </h2>
              <form className="flex items-center gap-2">
                <Input
                  type="month"
                  name="month"
                  defaultValue={month}
                  className="w-44"
                  dir="ltr"
                />
                <Button type="submit" variant="outline">
                  <CalendarDays /> عرض
                </Button>
              </form>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={CalendarCheck}
                label="الحجوزات"
                value={data.month_totals.bookings}
              />
              <StatCard
                icon={Wallet}
                label="الإيرادات المحصّلة"
                value={formatMoney(data.month_totals.revenue)}
              />
              <StatCard
                icon={Landmark}
                label="نصيب العيادة"
                value={formatMoney(data.month_totals.clinic_share)}
              />
              <StatCard
                icon={Ban}
                label="الحجوزات (مبالغ مستردة)"
                value={`${data.month_totals.cancelled} · ${formatMoney(data.month_totals.refunded)}`}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">الإيرادات حسب الطبيب</h2>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطبيب</TableHead>
                    <TableHead>الحجوزات</TableHead>
                    <TableHead>تم الكشف</TableHead>
                    <TableHead>الإيرادات</TableHead>
                    <TableHead>نصيب العيادة</TableHead>
                    <TableHead>نصيب الطبيب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.doctors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        لا يوجد أطباء مكتملو البيانات بعد
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.doctors.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="font-semibold">{d.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {d.specialty}
                          </div>
                        </TableCell>
                        <TableCell>{d.bookings}</TableCell>
                        <TableCell>{d.attended}</TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">
                          {formatMoney(d.revenue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatMoney(d.clinic_share)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatMoney(d.doctor_share)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
