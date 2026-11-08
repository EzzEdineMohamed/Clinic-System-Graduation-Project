import { requireRole } from "@/lib/auth";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/format";
import { authErrorMessage } from "@/lib/api-messages";
import { PageTitle } from "@/components/coming-next";
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
import type { StaffMember } from "@/types/admin";
import { AddStaffDialog } from "@/components/admin/add-staff-dialog";
import { StaffActions } from "@/components/admin/staff-actions";

export default async function AdminNurses() {
  const user = await requireRole("admin");

  let nurses: StaffMember[] = [];

  let error: string | undefined;
  try {
    // GET /rest/v1/profiles?role=eq.nurse
    nurses = await adminApi.listStaff(user.token, "nurse");
  } catch (e) {
    error = authErrorMessage(e);
  }

  const active = nurses.filter((n) => n.is_active).length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          title="السكرتارية"
          subtitle={`${nurses.length} سكرتارية، منهم ${active} شغال`}
        />
        <AddStaffDialog role="nurse" />
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden py-0">
        {nurses.length === 0 ? (
          <CardContent className="py-12 text-center text-muted-foreground">
            لسه مفيش سكرتارية.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>الاسم</TableHead>
                <TableHead>الأيميل</TableHead>
                <TableHead>الموبايل</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nurses.map((n) => (
                <TableRow
                  key={n.id}
                  className={n.is_active ? "" : "opacity-60"}
                >
                  <TableCell className="font-semibold">{n.full_name}</TableCell>
                  <TableCell dir="ltr" className="text-end">
                    {n.email}
                  </TableCell>
                  <TableCell dir="ltr" className="text-end">
                    {n.phone}
                  </TableCell>
                  <TableCell>{formatDate(n.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={n.is_active ? "default" : "secondary"}>
                      {n.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StaffActions member={n} />
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
