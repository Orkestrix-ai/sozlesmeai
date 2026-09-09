"use client";

import * as React from "react";
import { RadioGroup as RadixRadioGroup } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * design.md ayrı bir form kontrolü bölümü tanımlamıyor; `Input`/`Select` ile
 * aynı kenarlık ve odak dilini paylaşır (§10'un radius + odak halkası
 * sistemi). Seçili nokta kırmızı DEĞİL `ink-950`: §3 kırmızıyı %5'te tutuyor
 * ve ekranın tek birincil eylemi zaten kırmızı submit butonu — seçim durumu
 * nötr kalır, kırmızı yalnızca odak halkasında kullanılır.
 *
 * Hata durumu `aria-invalid` ile Root'a düşer; `group/radio` üzerinden
 * item'ların kenarlığına taşınır (`Input`'un `aria-invalid:border-state-error`
 * davranışının grup karşılığı).
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadixRadioGroup.Root>) {
  return (
    <RadixRadioGroup.Root
      data-slot="radio-group"
      className={cn("group/radio grid gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadixRadioGroup.Item>) {
  return (
    <RadixRadioGroup.Item
      data-slot="radio-group-item"
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full border border-stone-200 bg-paper-50 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-brand-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-ink-950",
        "group-aria-invalid/radio:border-state-error group-aria-invalid/radio:focus-visible:ring-state-error",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator
        data-slot="radio-group-indicator"
        className="size-2 rounded-full bg-ink-950"
      />
    </RadixRadioGroup.Item>
  );
}

export { RadioGroup, RadioGroupItem };
