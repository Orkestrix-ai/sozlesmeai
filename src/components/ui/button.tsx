import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * design.md §10 — Buton ve durum sistemi.
 *
 * Kurallar:
 * - Her ekranda YALNIZCA BİR `primary` buton bulunur (design.md §5).
 * - `danger` kullanımı onay modalı ile birlikte zorunludur (design.md §10);
 *   geri döndürülemez işlemleri modalsız tetiklemeyin.
 * - `onDark` ve `inverse` yalnızca ink-950/ink-900 yüzeylerin üzerinde
 *   kullanılır (hero, navbar, final CTA, sidebar).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] text-button font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-paper-50 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-red-600 text-paper-50 hover:bg-brand-red-700 disabled:bg-primary-disabled",
        secondary:
          "border border-stone-400 bg-transparent text-ink-900 hover:bg-paper-100 disabled:opacity-50",
        ghost:
          "bg-transparent text-ink-900 hover:bg-paper-100 disabled:opacity-50",
        danger:
          "bg-state-error text-paper-50 hover:bg-[#9b2118] disabled:opacity-50",
        /** Koyu yüzey üzerinde ikincil aksiyon (design.md §6.2). */
        onDark:
          "border border-stone-200/40 bg-transparent text-paper-50 hover:bg-paper-50/10 focus-visible:ring-offset-ink-950 disabled:opacity-50",
        /** Kırmızı/koyu zeminde ters birincil aksiyon (design.md §6.8). */
        inverse:
          "bg-paper-50 text-ink-950 hover:bg-paper-100 focus-visible:ring-offset-transparent disabled:opacity-50",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[0.9688rem]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
