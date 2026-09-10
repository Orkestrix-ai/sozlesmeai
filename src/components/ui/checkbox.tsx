"use client";

import * as React from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * design.md ayrı bir form kontrolü bölümü tanımlamıyor; `Input` ile aynı
 * kenarlık, odak ve `aria-invalid` dilini paylaşır.
 *
 * Radius istisnası: §5'in 8–12 px aralığı kart/panel/buton içindir. 18 px'lik
 * bir kutuda 10 px radius neredeyse daire olur ve `RadioGroupItem`'ın
 * `rounded-full`'undan ayırt edilemez — bu yüzden 4 px.
 *
 * İşaretli kutu kırmızı DEĞİL `ink-950`: §3 kırmızıyı %5'te tutuyor ve
 * ekranın tek birincil eylemi zaten kırmızı submit butonu. Kırmızı yalnızca
 * odak halkasında, diğer form alanlarıyla tutarlı biçimde kullanılır.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof RadixCheckbox.Root>) {
  return (
    <RadixCheckbox.Root
      data-slot="checkbox"
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border border-stone-200 bg-paper-50 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-ink-950 data-[state=checked]:bg-ink-950",
        "aria-invalid:border-state-error aria-invalid:focus-visible:ring-state-error",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        <Check className="size-3 text-paper-50" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

export { Checkbox };
