"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/** Tiny spinner inside a <Link>, visible only while that navigation is pending.
 *  Always rendered (opacity toggle) so the link never jumps in size. */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3 shrink-0 rounded-full border-2 border-current border-t-transparent transition-opacity",
        pending ? "animate-spin opacity-70" : "opacity-0",
        className,
      )}
    />
  );
}
