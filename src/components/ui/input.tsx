import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * design.md §10 — form alanı temel çizgisi (buton sistemiyle aynı radius ve
 * odak halkası). Hatalı alanlar `aria-invalid` ile state-error'a döner;
 * hata metnini `Field` bileşeni ayrıca gösterir.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-3 text-body text-stone-800 outline-none transition-colors placeholder:text-stone-400",
        "focus-visible:ring-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-state-error aria-invalid:focus-visible:ring-state-error",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
