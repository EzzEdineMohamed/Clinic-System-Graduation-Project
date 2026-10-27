import { Hammer } from "lucide-react";

/** Placeholder for pages whose logic comes in the next phase. */
export function ComingNext({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-muted-foreground">
        <Hammer className="size-4" />
        <span className="text-sm font-semibold">المرحلة الجاية</span>
      </div>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function InfoRow({ label, value, ltr }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{ltr ? <span dir="ltr">{value}</span> : value}</dd>
    </div>
  );
}
