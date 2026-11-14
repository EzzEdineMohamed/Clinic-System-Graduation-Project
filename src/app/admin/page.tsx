import { requireRole } from "@/lib/auth";
import { ComingNext, PageTitle } from "@/components/coming-next";
import { redirect } from "next/navigation";

export default async function AdminHome() {
  redirect("/admin/doctors");

  // await requireRole("admin");

  // return (
  //   <>
  //     <PageTitle title="لوحة التحكم" />
  //     <ComingNext
  //       title="نظرة عامة"
  //       items={[
  //         "عائد العيادة يومي / شهري / سنوي (30% من كل كشف حضر)",
  //         "الدكتور الموجود دلوقتي",
  //         "عدد المرضى المسجلين",
  //       ]}
  //     />
  //   </>
  // );
}
