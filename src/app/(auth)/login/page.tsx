import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول | عيادتي" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const notice = error === "inactive" ? "هذا الحساب موقوف، يُرجى التواصل مع إدارة العيادة" : undefined;

  return (
    <>
      <h1 className="text-3xl font-extrabold">مرحبًا بك</h1>
      <p className="mt-2 mb-8 text-muted-foreground">سجّل الدخول بالبريد الإلكتروني وكلمة المرور</p>
      <LoginForm notice={notice} />
    </>
  );
}
