import Link from "next/link";
import { Search, X } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminApi } from "@/lib/admin-api";
import { GENDER_LABEL, NONE, ageFromDob, formatDate } from "@/lib/format";
import { authErrorMessage } from "@/lib/api-messages";
import { PageTitle } from "@/components/coming-next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatientRow } from "@/lib/validation/auth";

export default async function AdminPatients({
  searchParams,
}: PageProps<"/admin/patients">) {
  const user = await requireRole("admin");

  // ?q=... من الرابط
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";

  let patients: PatientRow[] = [];
  let error: string | undefined;
  try {
    // GET /rest/v1/patients?select=...,appointments(count)
    patients = await adminApi.listPatients(user.token, search);
  } catch (e) {
    error = authErrorMessage(e);
  }

  const online = patients.filter((p) => p.profile_id).length;

  return (
    <>
      <PageTitle
        title="المرضى"
        subtitle={
          search
            ? `${patients.length} نتيجة لـ "${search}"`
            : `${patients.length} مريض: ${online} أونلاين و ${patients.length - online} من العيادة`
        }
      />

      {/* البحث: فورم GET عادي بيحط ?q= في الرابط */}
      <form method="get" className="mb-4 flex max-w-lg gap-2">
        <Input
          name="q"
          defaultValue={search}
          placeholder="ابحث بالاسم أو رقم الموبايل"
        />
        <Button type="submit" variant="outline">
          <Search /> بحث
        </Button>
        {search && (
          <Button asChild variant="ghost">
            <Link href="/admin/patients">
              <X /> مسح
            </Link>
          </Button>
        )}
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden py-0">
        {patients.length === 0 ? (
          <CardContent className="py-12 text-center text-muted-foreground">
            {search ? "مفيش مريض بالاسم أو الرقم ده." : "لسه مفيش مرضى."}
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>المريض</TableHead>
                <TableHead>الموبايل</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السن</TableHead>
                <TableHead>مرض مزمن</TableHead>
                <TableHead>عدد الحجوزات حتى الان</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-semibold">{p.full_name}</p>
                    <Badge variant="outline" className="mt-1 text-[11px]">
                      {p.profile_id ? "أونلاين" : "من العيادة"}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-end">
                    {p.phone}
                  </TableCell>
                  <TableCell>
                    {p.gender ? GENDER_LABEL[p.gender] : "-"}
                  </TableCell>
                  <TableCell>
                    {p.date_of_birth
                      ? `${ageFromDob(p.date_of_birth)} سنة`
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    {p.chronic_disease || NONE}
                  </TableCell>
                  <TableCell>{p.appointments[0]?.count ?? 0}</TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
