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
import { Phone } from "lucide-react";

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
        title={`مرحبًا ${(user.full_name ?? "").split(" ")[0]}`}
        subtitle="اختار الدكتور و المعاد المناسب "
      />

      <a
        href="tel:+201151516684"
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/15"
      >
        <Phone className="size-4" />
        <span>للحجز بطرق أخرى، اتصل بالعيادة على</span>
        <span dir="ltr" className="font-bold">
          01151516684
        </span>
      </a>
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
