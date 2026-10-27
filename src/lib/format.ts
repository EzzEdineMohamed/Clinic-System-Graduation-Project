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
