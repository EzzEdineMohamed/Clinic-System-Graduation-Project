// =====================================================================
// تواريخ الحجز: النهارده بتوقيت القاهرة، والأيام الجاية، وشكلها بالعربي.
// التاريخ هنا دايماً نص "YYYY-MM-DD"، نفس شكل appointment_date في الداتابيز.
// =====================================================================

const CAIRO = "Africa/Cairo";

/** النهارده بتوقيت القاهرة: "2026-11-14" */
export function cairoToday(): string {
  // en-CA بيكتب التاريخ بالشكل YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO }).format(
    new Date(),
  );
}

/** "2026-11-14" + 3 → "2026-11-17" */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** يوم الأسبوع: 0 الحد ... 6 السبت (نفس day_of_week في الداتابيز) */
export function dayOfWeek(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/** الأيام من النهارده لحد 30 يوم قدام، اللي الدكتور بيشتغل فيها بس */
export function upcomingDays(workDays: number[]): string[] {
  const today = cairoToday();
  const days: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const day = addDays(today, i);
    if (workDays.includes(dayOfWeek(day))) days.push(day);
  }
  return days;
}

/** "2026-11-17" → "الثلاثاء 17 نوفمبر" */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
