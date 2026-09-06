import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/landing/container";

/**
 * design.md §6.8 — brand-red-700 zemin, paper-50 başlık,
 * #F3D2D0 açıklama, paper-50 zeminli / ink-950 metinli CTA.
 */
export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section id="final-cta" className="bg-brand-red-700 py-20 sm:py-24">
      <Container className="text-center">
        <h2 className="mx-auto max-w-2xl font-heading text-[1.75rem] font-bold leading-tight tracking-tight text-paper-50 sm:text-[2rem] lg:text-section">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-cta-muted">
          {t("description")}
        </p>

        <div className="mt-9">
          <Button size="lg" variant="inverse" asChild>
            <a href="#product">{t("cta")}</a>
          </Button>
        </div>

        <p className="mt-5 text-helper text-cta-muted">{t("note")}</p>
      </Container>
    </section>
  );
}
