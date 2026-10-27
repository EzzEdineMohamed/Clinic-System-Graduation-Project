import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Profile, Role } from "@/types/auth";
import { ACCESS_COOKIE } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

export type CurrentUser = Profile & { token: string };

/** The logged-in user (calls get_my_profile once per request), or null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const me = await api.me(token);
    if (!me || !me.is_active) return null;
    return { ...me, token };
  } catch {
    return null;
  }
});

/** Guard for each role's layout: wrong role → its own home, not logged in → /login. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
