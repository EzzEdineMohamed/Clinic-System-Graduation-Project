// =====================================================================
// صفحة "احجز كشف": /patient
// Server Component: بيجيب الدكاترة بتوكن المريض، ويسلمهم لخطوات الحجز.
// =====================================================================

import { requireRole } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import type { BookableDoctor } from "@/types/booking";
import { PageTitle } from "@/components/coming-next";
import { BookingFlow } from "@/components/patient/booking-flow";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function PatientHome() {
  const user = await requireRole("patient");

  let doctors: BookableDoctor[] = [];
  let error: string | undefined;
  try {
    doctors = await bookingApi.listDoctors(user.token);
  } catch (err) {
    error = authErrorMessage(err);
  }

  return (
    <>
      <PageTitle
        title={`أهلاً ${(user.full_name ?? "").split(" ")[0]}`}
        subtitle="اختار الدكتور و المعاد المناسب "
      />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <BookingFlow doctors={doctors} />
      )}
    </>
  );
}
