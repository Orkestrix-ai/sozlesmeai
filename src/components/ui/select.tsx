import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Native `<select>` — design.md dördüncü bir form primitifi istemiyor;
 * `Input` ile aynı çizgi/odak dilini paylaşır (bkz. input.tsx).
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-10 w-full appearance-none rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-3 pr-9 text-body text-stone-800 outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-state-error aria-invalid:focus-visible:ring-state-error",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-400"
        aria-hidden="true"
      />
    </div>
  );
}

export { Select };
