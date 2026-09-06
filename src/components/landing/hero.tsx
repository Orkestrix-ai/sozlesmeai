import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { HeroPanel } from "@/components/landing/hero-panel";

/**
 * design.md §6.2 — ink-950 zemin, paper-50 başlık, stone-400 açıklama,
 * brand-red-500 vurgulu ifade, brand-red-600 birincil CTA.
 */
export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="bg-ink-950 pb-16 pt-14 sm:pb-24 sm:pt-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <p className="text-helper font-medium uppercase tracking-[0.14em] text-stone-400">
            {t("eyebrow")}
          </p>

          <h1 className="mt-5 font-heading text-[2.5rem] font-bold leading-[1.08] tracking-tight text-paper-50 sm:text-[3.25rem] lg:text-hero">
            {t("titleLead")}{" "}
            <span className="text-brand-red-500">{t("titleHighlight")}</span>
          </h1>

          <p className="mt-6 max-w-xl text-stone-400">{t("description")}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Ekranın tek birincil aksiyonu (design.md §5). */}
            <Button size="lg" asChild>
              <a href="#final-cta">{t("primaryCta")}</a>
            </Button>
            <Button size="lg" variant="onDark" asChild>
              <a href="#how-it-works">{t("secondaryCta")}</a>
            </Button>
          </div>

          {/* ink-950 üzerinde stone-600 ~3.4:1 kontrast verir (AA altı);
              koyu yüzeyde yardımcı metin stone-400 olmalı. */}
          <p className="mt-6 text-helper text-stone-400">{t("note")}</p>
        </div>

        <HeroPanel />
      </Container>
    </section>
  );
}
