import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "حساب جديد | عيادتي" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold">حساب مريض جديد</h1>
      <p className="mt-2 mb-8 text-muted-foreground">سجل بياناتك علشان تقدر تحجز كشف أونلاين</p>
      <RegisterForm />
    </>
  );
}
