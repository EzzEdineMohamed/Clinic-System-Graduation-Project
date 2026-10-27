// Where the login tokens live: two cookies.
// The browser writes them after login; the Next.js server (proxy.ts and
// the pages) reads them to call the API as that user.

import type { Session } from "@/types/auth";

export const ACCESS_COOKIE = "clinic-access-token";
export const REFRESH_COOKIE = "clinic-refresh-token";
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Seconds until this JWT expires (negative = already expired). Reads it, does not verify it:
 *  Supabase verifies every token itself on every call. */
export function secondsLeft(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return -1;
  }
}

// ---------- Browser side ------------------------------------------------

function setCookie(name: string, value: string, maxAge: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | undefined {
  const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : undefined;
}

export function saveSession(s: Session) {
  setCookie(ACCESS_COOKIE, s.access_token, s.expires_in);
  setCookie(REFRESH_COOKIE, s.refresh_token, REFRESH_MAX_AGE);
}

export function getAccessToken() {
  return getCookie(ACCESS_COOKIE);
}

export function clearSession() {
  setCookie(ACCESS_COOKIE, "", 0);
  setCookie(REFRESH_COOKIE, "", 0);
}
