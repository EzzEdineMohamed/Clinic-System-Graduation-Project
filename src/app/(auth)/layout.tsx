import { Stethoscope, CalendarCheck, ShieldCheck, FileText } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-primary/25 blur-3xl"
        />
        <div className="relative flex items-center gap-3 text-lg font-bold">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          عيادتي
        </div>

        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl leading-[1.35] font-extrabold">
            احجز كشفك في دقيقة،
            <br />
            وتابع روشتتك من بيتك.
          </h2>
          <ul className="space-y-4 text-sidebar-foreground/80">
            <li className="flex items-center gap-3">
              <CalendarCheck className="size-5 text-primary" /> مواعيد الدكاترة كلها قدامك
            </li>
            <li className="flex items-center gap-3">
              <FileText className="size-5 text-primary" /> الروشتة والتشخيص في سجلك
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" /> بياناتك محدش يشوفها غيرك وغير دكتورك
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-sidebar-foreground/60">© {new Date().getFullYear()} عيادتي</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-lg font-bold lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </span>
            عيادتي
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
