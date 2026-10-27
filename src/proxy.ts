import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import type { Role, Session } from "@/types/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_MAX_AGE, secondsLeft } from "@/lib/session";
import { AUTH_PAGES, ROLE_HOME, roleForPath } from "@/lib/roles";

/**
 * Runs before every page:
 *  1. access token about to expire → get a new one with the refresh token
 *  2. asks the API who the user is (get_my_profile)
 *  3. not logged in + protected page   → /login
 *     logged in + /login or /register  → own home
 *     logged in + another role's area  → own home
 * Each role layout re-checks with requireRole(), and RLS protects the data
 * itself, so this is the first of three layers, not the only one.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = roleForPath(pathname);
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isRoot = pathname === "/";

  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let renewed: Session | null = null;

  // 1. refresh the token if it is missing or has less than a minute left
  if (refresh && (!access || secondsLeft(access) < 60)) {
    try {
      renewed = await api.refresh(refresh);
      access = renewed.access_token;
      request.cookies.set(ACCESS_COOKIE, access); // so the page sees the new token
    } catch {
      access = undefined;
    }
  }

  // 2. who is it?
  let role: Role | null = null;
  let inactive = false;
  if (access) {
    try {
      const me = await api.me(access);
      if (me?.is_active) role = me.role;
      else if (me) inactive = true;
    } catch {
      role = null;
    }
  }

  // 3. decide
  let response: NextResponse;
  const go = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
    return NextResponse.redirect(url);
  };

  if (!role) {
    response = requiredRole || isRoot ? go("/login", inactive ? { error: "inactive" } : undefined) : NextResponse.next({ request });
    if (access || refresh) {
      // bad, expired or deactivated session: drop it
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }
    return response;
  }

  if (isAuthPage || isRoot || (requiredRole && requiredRole !== role)) {
    response = go(ROLE_HOME[role]);
  } else {
    response = NextResponse.next({ request });
  }

  if (renewed) {
    const opts = { path: "/", sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:" };
    response.cookies.set(ACCESS_COOKIE, renewed.access_token, { ...opts, maxAge: renewed.expires_in });
    response.cookies.set(REFRESH_COOKIE, renewed.refresh_token, { ...opts, maxAge: REFRESH_MAX_AGE });
  }
  return response;
}

export const config = {
  matcher: [
    // everything except static files, images and the favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
