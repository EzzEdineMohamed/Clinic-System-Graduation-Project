import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "تسجيل الدخول | عيادتي" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const notice = error === "inactive" ? "الحساب ده موقوف، كلم إدارة العيادة" : undefined;

  return (
    <>
      <h1 className="text-3xl font-extrabold">أهلاً بيك</h1>
      <p className="mt-2 mb-8 text-muted-foreground">سجل دخولك بالأيميل والباسوورد</p>
      <LoginForm notice={notice} />
    </>
  );
}
