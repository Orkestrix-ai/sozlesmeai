"use client";

import * as React from "react";
import { Progress as RadixProgress } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * İnce ilerleme/kullanım çubuğu. Dolulukla renk değişimi çağıran tarafın
 * sorumluluğu: `indicatorClassName` ile `bg-ink-800` → `bg-state-warning` →
 * `bg-brand-red-500` geçişi kurulur.
 *
 * NOT: Tek kullanıcısı olan `dashboard/usage-meter.tsx`, aylık kredi tahsisi
 * kavramıyla birlikte kaldırıldı (kullandıkça-öde geçişi). Primitif kitapta
 * ve /style-guide'da duruyor; şu an ekranlarda kullanılmıyor.
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
