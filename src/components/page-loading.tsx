import { Skeleton } from "@/components/ui/skeleton";

/** Shown instantly while a role page loads its data (used by each loading.tsx). */
export function PageLoading({ cards = 0 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite" className="animate-in fade-in duration-300">
      <span className="sr-only">جاري التحميل…</span>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-72 max-w-full" />
      {cards > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-xl border bg-card p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
