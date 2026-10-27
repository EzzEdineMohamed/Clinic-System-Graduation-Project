// Shared by proxy.ts (runs before every request) and server code.
// Keep this file free of server-only imports.

import type { Role } from "@/types/auth";

export type { Role };
export const ROLES: readonly Role[] = ["patient", "nurse", "doctor", "admin"];

/** The one area each role is allowed into. */
export const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  nurse: "/nurse",
  doctor: "/doctor",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  patient: "مريض",
  nurse: "ممرضة",
  doctor: "دكتور",
  admin: "مدير العيادة",
};

/** Which role owns a given path, or null if the path is not role-protected. */
export function roleForPath(pathname: string): Role | null {
  for (const role of ROLES) {
    const home = ROLE_HOME[role];
    if (pathname === home || pathname.startsWith(home + "/")) return role;
  }
  return null;
}

export const AUTH_PAGES = ["/login", "/register"];
