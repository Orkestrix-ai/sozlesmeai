import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Mevcut `state-*` yüzey/metin token çiftlerine bağlı satır içi bildirim.
 * `neutral`, design.md §7.2'nin "agresif banner yerine sakin inline mesaj"
 * kuralı için — dolu bir yüzey veya kırmızı buton İÇERMEZ.
 */
const alertVariants = cva("rounded-[var(--radius)] border p-4 text-body", {
  variants: {
    variant: {
      neutral: "border-stone-200 bg-paper-50 text-stone-800",
      info: "border-transparent bg-state-info-surface text-state-info-text",
      success: "border-transparent bg-state-success-surface text-state-success-text",
      warning: "border-transparent bg-state-warning-surface text-state-warning-text",
      error: "border-transparent bg-state-error-surface text-state-error-text",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-description"
      className={cn("text-helper", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
