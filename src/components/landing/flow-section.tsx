import { useTranslations } from "next-intl";

import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

const STEPS = ["describe", "complete", "edit", "pdf", "share"] as const;

/**
 * design.md §6.4 — beş adımlı süreç.
 * Adım numarası ink-950, aktif adım brand-red-600, bağlantı çizgileri
 * stone-200. Landing'de "aktif" kavramı yok; ilk adım giriş noktası olduğu
 * için kırmızıyla işaretlenir, geri kalanı nötr kalır (kırmızı enflasyonu
 * olmaması için — design.md §3).
 */
export function FlowSection() {
  const t = useTranslations("flow");

  return (
    <section id="how-it-works" className="bg-paper-50 pb-20 sm:pb-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => {
            const isFirst = index === 0;
            return (
              <li key={step} className="relative">
                {/* Bağlantı çizgisi (yalnızca masaüstü, son adımda yok). */}
                {index < STEPS.length - 1 ? (
                  <div
                    className="absolute left-9 right-0 top-4 hidden h-px bg-stone-200 lg:block"
                    aria-hidden="true"
                  />
                ) : null}

                <div className="relative flex items-center">
                  <span
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full text-helper font-semibold",
                      isFirst
                        ? "bg-brand-red-600 text-paper-50"
                        : "bg-paper-100 text-ink-950",
                    )}
                    data-numeric
                  >
                    {index + 1}
                  </span>
                </div>

                <p className="mt-5 text-helper text-stone-400" data-numeric>
                  {t("stepLabel", { number: index + 1 })}
                </p>
                <h3 className="mt-1 text-card-title font-semibold text-ink-950">
                  {t(`steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-helper leading-relaxed text-stone-600">
                  {t(`steps.${step}.body`)}
                </p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
