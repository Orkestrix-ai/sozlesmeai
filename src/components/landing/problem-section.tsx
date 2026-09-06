import { useTranslations } from "next-intl";
import { FileQuestion, GitCompareArrows, SearchX } from "lucide-react";

import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

/**
 * `critical` yalnızca TEK kartta true: design.md §6.3 kırmızıyı "kritik vurgu"
 * için ister, §3 ise kırmızının dekorasyon olmasını yasaklar. Üç kartın
 * üçünde de kırmızı çizgi olsaydı çizgi bir işaret değil, süs olurdu.
 * Riski taşıyan madde (gözden kaçan hükümler) işaretlendi.
 */
const ITEMS = [
  { key: "blank", Icon: FileQuestion, critical: false },
  { key: "missing", Icon: SearchX, critical: true },
  { key: "versions", Icon: GitCompareArrows, critical: false },
] as const;

/**
 * design.md §6.3 — paper-50 zemin, ink-950 başlık, stone-600 metin,
 * ink-800 ikonlar, kritik vurgu ince brand-red-600 çizgi.
 */
export function ProblemSection() {
  const t = useTranslations("problem");

  return (
    <section id="product" className="bg-paper-50 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {ITEMS.map(({ key, Icon, critical }) => (
            <div key={key} className="border-t border-stone-200 pt-6">
              {/* Kritik vurgu: ince kırmızı çizgi (dekorasyon değil, işaret). */}
              <div
                className={cn(
                  "-mt-[1px] mb-6 h-[2px] w-10",
                  critical ? "bg-brand-red-600" : "bg-transparent",
                )}
              />
              <Icon className="size-6 text-ink-800" aria-hidden="true" />
              <h3 className="mt-4 text-card-title font-semibold text-ink-950">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-stone-600">{t(`items.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
