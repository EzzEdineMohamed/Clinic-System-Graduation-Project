// =====================================================================
// صفحة "حجز جديد" (الممرضة): /nurse/new
// Server Component: بيجيب الدكاترة، ويسلمهم لخطوات الحجز من العيادة.
// =====================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { authErrorMessage } from "@/lib/api-messages";
import { bookingApi } from "@/lib/booking-api";
import type { BookableDoctor } from "@/types/booking";
import { PageTitle } from "@/components/coming-next";
import { ClinicBooking } from "@/components/nurse/clinic-booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function NurseNewBooking() {
  const user = await requireRole("nurse");

  let doctors: BookableDoctor[] = [];
  let error: string | undefined;
  try {
    doctors = await bookingApi.listDoctors(user.token);
  } catch (err) {
    error = authErrorMessage(err);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle
          title="حجز جديد"
          subtitle="للمريض اللي في العيادة: كاش أو فيزا"
        />
        <Button variant="outline" asChild>
          <Link href="/nurse">
            <ArrowRight /> الحجوزات
          </Link>
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <ClinicBooking doctors={doctors} />
      )}
    </>
  );
}
