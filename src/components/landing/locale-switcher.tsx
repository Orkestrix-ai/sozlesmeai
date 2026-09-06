"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Aynı sayfada kalarak dili değiştirir (design.md §6.1 navbar).
 * Koyu navbar üzerinde durduğu için `onDark` tonlarıyla çizildi.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => {
      // `params`, dinamik segmentli rotalarda pathname'i yeniden kurmak için gerekir.
      router.replace(
        // @ts-expect-error -- pathname ve params tipleri rota bazlı daralır.
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={t("label")}
    >
      <Languages className="mr-1 size-4 text-stone-400" aria-hidden="true" />
      {routing.locales.map((option) => {
        const isActive = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            disabled={isPending}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-[calc(var(--radius)*0.6)] px-2 py-1 text-helper font-medium transition-colors",
              isActive
                ? "bg-paper-50/10 text-paper-50"
                : "text-stone-400 hover:text-paper-50",
              isPending && "opacity-60",
            )}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
