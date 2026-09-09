import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

/**
 * design.md §6.6 — üç paket yan yana, kart başına en fazla 5–6 fark.
 *
 * PAKET ADLARI: PRD'deki Starter / Pro / Business geçerlidir.
 * design.md'nin Pro/Business adları koddakiyle zaten birebir aynı; yalnızca
 * design.md'nin "Free"si kodun "Starter"ına karşılık gelir (bkz. CLAUDE.md
 * "Package naming"). Kart stilleri design.md'den birebir alındı.
 *
 * Kırmızı CTA yalnızca Business kartındadır (design.md §6.6). Diğer iki kart
 * ikincil buton kullanır — böylece bölümde tek bir kırmızı aksiyon kalır
 * (design.md §3 ve §5).
 */
/**
 * `featureKeys` kısa ("f1") değil TAM yol tutar: `.map` destructuring'i `key`
 * ile `featureKeys` arasındaki korelasyonu kopardığı için `plans.${key}
 * .features.${featureKey}` şablonu tip düzeyinde çapraz çarpıma dönüşüyor ve
 * var olmayan `plans.starter.features.f6`yı üretiyordu (starter'da f1–f5 var).
 * Tam yol yazınca anahtarlar doğrudan `tr.json` şemasına karşı denetleniyor.
 */
const PLANS = [
  {
    key: "starter",
    featureKeys: [
      "plans.starter.features.f1",
      "plans.starter.features.f2",
      "plans.starter.features.f3",
      "plans.starter.features.f4",
      "plans.starter.features.f5",
    ],
    popular: false,
    tone: "plain",
  },
  {
    key: "pro",
    featureKeys: [
      "plans.pro.features.f1",
      "plans.pro.features.f2",
      "plans.pro.features.f3",
      "plans.pro.features.f4",
      "plans.pro.features.f5",
      "plans.pro.features.f6",
    ],
    popular: true,
    tone: "outlined",
  },
  {
    key: "business",
    featureKeys: [
      "plans.business.features.f1",
      "plans.business.features.f2",
      "plans.business.features.f3",
      "plans.business.features.f4",
      "plans.business.features.f5",
      "plans.business.features.f6",
    ],
    popular: false,
    tone: "dark",
  },
] as const;

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="bg-paper-50 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PLANS.map(({ key, featureKeys, popular, tone }) => {
            const isDark = tone === "dark";
            const price = t(`plans.${key}.price`);
            // "Teklif alın" gibi metinsel değerlerde /ay eki gösterilmez.
            const isNumericPrice = /\d/.test(price);

            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-2xl border p-7",
                  tone === "plain" && "border-stone-200 bg-paper-50",
                  tone === "outlined" && "border-ink-950 bg-paper-50",
                  isDark && "border-ink-950 bg-ink-950",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={cn(
                      "text-card-title font-semibold",
                      isDark ? "text-paper-50" : "text-ink-950",
                    )}
                  >
                    {t(`plans.${key}.name`)}
                  </h3>
                  {popular ? (
                    // Kırmızı dolgu değil, açık kırmızı yüzey (design.md §6.6).
                    <span className="rounded-full bg-state-error-surface px-2.5 py-1 text-helper font-medium text-brand-red-700">
                      {t("popularBadge")}
                    </span>
                  ) : null}
                </div>

                <p
                  className={cn(
                    "mt-5 font-heading text-[2rem] font-bold leading-none tracking-tight",
                    isDark ? "text-paper-50" : "text-ink-950",
                  )}
                  data-numeric
                >
                  {price}
                  {isNumericPrice ? (
                    <span
                      className={cn(
                        "ml-1.5 text-helper font-normal",
                        isDark ? "text-stone-400" : "text-stone-600",
                      )}
                    >
                      {t("perMonth")}
                    </span>
                  ) : null}
                </p>

                <p
                  className={cn(
                    "mt-3 text-helper leading-relaxed",
                    isDark ? "text-stone-400" : "text-stone-600",
                  )}
                >
                  {t(`plans.${key}.tagline`)}
                </p>

                <ul className="mt-7 grow space-y-3">
                  {featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isDark ? "text-stone-400" : "text-state-success",
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "text-helper leading-relaxed",
                          isDark ? "text-paper-50" : "text-stone-800",
                        )}
                      >
                        {t(featureKey)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-8 w-full"
                  variant={isDark ? "primary" : "secondary"}
                  asChild
                >
                  <a href="#final-cta">{t(`plans.${key}.cta`)}</a>
                </Button>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
