import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

// proxy.ts already redirects "/", this is a fallback.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? ROLE_HOME[user.role] : "/login");
}
