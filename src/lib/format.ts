/** Age in full years from an ISO date (yyyy-mm-dd). */
export function ageFromDob(dob: string, today = new Date()): number {
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export const GENDER_LABEL = { male: "ذكر", female: "أنثى" } as const;

export const NONE = "لا يوجد";

/** "2026-10-28T11:56:23+00:00" → "28 أكتوبر 2026" بتوقيت القاهرة */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

/** أيام الأسبوع بنفس ترتيب day_of_week في الداتابيز (0 = الأحد) */
// formatting days of week into arabic names , what return from backend is number of day of week
export const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

/** "19:00:00" → "7:00 م" */
export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`;
}

/** 300 → "300 ج.م"، و 1500 → "1,500 ج.م" */
// formatting cost into egyptian pounds wuth arabic number with arabic egyption pound symbol
export function formatMoney(n: number): string {
  return `${new Intl.NumberFormat("ar-EG-u-nu-latn").format(n)} ج.م`;
}
