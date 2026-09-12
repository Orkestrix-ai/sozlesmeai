import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `Input`'un çok satırlı karşılığı — aynı radius, aynı kenarlık, aynı odak
 * halkası (design.md §10). Yükseklik dışında tek farkı `resize-y`: kullanıcı
 * uzun bir "özel şartlar" metnini yazarken alanı büyütebilmeli, ama yatayda
 * form kolonunu bozamamalı.
 *
 * Bu primitive daha önce yoktu; ham `<textarea>` iki yerde elle
 * biçimlendirilmişti (chat-panel.tsx koyu yüzeyde, draft-panel.tsx açık
 * yüzeyde). Buradaki açık yüzey sürümüdür.
 */
function Textarea({ className, rows = 4, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        "flex w-full resize-y rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-3 py-2 text-body text-stone-800 outline-none transition-colors placeholder:text-stone-400",
        "focus-visible:ring-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-state-error aria-invalid:focus-visible:ring-state-error",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
