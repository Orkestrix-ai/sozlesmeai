"use client";

import * as React from "react";
import { Progress as RadixProgress } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * design.md §7.2 — ince kullanım çubuğu. Dolulukla renk değişimi çağıran
 * tarafın sorumluluğu (bkz. dashboard/usage-meter.tsx): `indicatorClassName`
 * ile `bg-ink-800` → `bg-state-warning` → `bg-brand-red-500` geçişi kurulur.
 */
function Progress({
  className,
  indicatorClassName,
  value,
  ...props
}: React.ComponentProps<typeof RadixProgress.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <RadixProgress.Root
      data-slot="progress"
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-paper-100",
        className,
      )}
      value={value}
      {...props}
    >
      <RadixProgress.Indicator
        data-slot="progress-indicator"
        className={cn("h-full flex-1 bg-ink-800 transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </RadixProgress.Root>
  );
}

export { Progress };
