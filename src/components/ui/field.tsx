import * as React from "react";
import { cn } from "@/lib/utils";

/** Label + control + error message, stacked. */
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("grid gap-2", className)} {...props} />;
}

function FieldError({ errors, id }: { errors?: string[]; id?: string }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {errors[0]}
    </p>
  );
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs text-muted-foreground", className)} {...props} />;
}

export { Field, FieldError, FieldHint };
