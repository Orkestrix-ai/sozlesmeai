import { useTranslations } from "next-intl";
import {
  Archive,
  History,
  LayoutList,
  MessageSquareText,
  ScanSearch,
  Wand,
} from "lucide-react";

import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "naturalLanguage", Icon: MessageSquareText, featured: false },
  { key: "sectioned", Icon: LayoutList, featured: false },
  { key: "editing", Icon: Wand, featured: true },
  { key: "riskCheck", Icon: ScanSearch, featured: false },
  { key: "versions", Icon: History, featured: false },
  { key: "archive", Icon: Archive, featured: false },
] as const;

/**
 * design.md §6.5 — paper-100 zemin, paper-50 kartlar, stone-200 border,
 * ink-900 ikon. Öne çıkan kart: ink-950 zemin, paper-50 metin, küçük
 * kırmızı vurgu.
 */
export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section className="bg-paper-100 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ key, Icon, featured }) => (
            <div
              key={key}
              className={cn(
                "rounded-[var(--radius)] border p-6",
                featured
                  ? "border-ink-950 bg-ink-950"
                  : "border-stone-200 bg-paper-50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon
                  className={cn(
                    "size-6",
                    featured ? "text-paper-50" : "text-ink-900",
                  )}
                  aria-hidden="true"
                />
                {featured ? (
                  <span className="rounded-full bg-brand-red-600 px-2.5 py-1 text-helper font-medium text-paper-50">
                    {t("items.editing.badge")}
                  </span>
                ) : null}
              </div>

              <h3
                className={cn(
                  "mt-4 text-card-title font-semibold",
                  featured ? "text-paper-50" : "text-ink-950",
                )}
              >
                {t(`items.${key}.title`)}
              </h3>
              <p
                className={cn(
                  "mt-2 text-helper leading-relaxed",
                  featured ? "text-stone-400" : "text-stone-600",
                )}
              >
                {t(`items.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
