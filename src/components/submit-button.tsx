"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";

type Props = React.ComponentProps<typeof Button> & {
  pending: boolean;
  /** Text while the request runs, e.g. "جاري تسجيل الدخول…" */
  pendingText: string;
};

/** Submit button: disabled until the page is ready, then shows a spinner + text while the request runs. */
export function SubmitButton({ children, pending, pendingText, disabled, ...props }: Props) {
  const hydrated = useHydrated();
  const busy = pending || !hydrated;
  return (
    <Button type="submit" disabled={busy || disabled} aria-busy={busy} {...props}>
      {busy && <Loader2 className="animate-spin" />}
      {!hydrated ? "لحظة…" : pending ? pendingText : children}
    </Button>
  );
}
