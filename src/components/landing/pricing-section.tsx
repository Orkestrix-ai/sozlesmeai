import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";

/**
 * design.md §6.6 — eskiden üç paket kartı vardı. Paket/abonelik modeli
 * terk edildiği için (20260910120000_pay_as_you_go.sql) tek bir
 * "kullandıkça öde" kartı kaldı: fiyat sözleşme başınadır ve yalnızca
 * kullanıcı PDF'ini aldığında tahsil edilir.
 *
 * Kart, design.md'nin eski "Pro" tonunu kullanır (paper-50 zemin, ink-950
 * çerçeve) ve tek kırmızı CTA taşır — bölümde başka kırmızı aksiyon yok
 * (design.md §3 ve §5).
 *
 * `FEATURE_KEYS` kısa ("f1") değil TAM yol tutar: `.map` içinde şablon
 * literaliyle kurulan yollar tip düzeyinde çapraz çarpıma dönüşüp var
 * olmayan anahtarlar üretiyordu. Tam yol yazınca anahtarlar doğrudan
 * tr.json şemasına karşı denetleniyor.
 */
const FEATURE_KEYS = [
  "payg.features.f1",
  "payg.features.f2",
  "payg.features.f3",
  "payg.features.f4",
  "payg.features.f5",
] as const;

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="bg-paper-50 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <div className="mt-14 flex justify-center">
          <div className="flex w-full max-w-md flex-col rounded-2xl border border-ink-950 bg-paper-50 p-7">
            <h3 className="text-card-title font-semibold text-ink-950">{t("payg.name")}</h3>

            <p
              className="mt-5 font-heading text-[2rem] font-bold leading-none tracking-tight text-ink-950"
              data-numeric
            >
              {t("payg.price")}
              <span className="ml-1.5 text-helper font-normal text-stone-600">
                {t("perContract")}
              </span>
            </p>

            <p className="mt-3 text-helper leading-relaxed text-stone-600">{t("payg.tagline")}</p>

            <ul className="mt-7 grow space-y-3">
              {FEATURE_KEYS.map((featureKey) => (
                <li key={featureKey} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-state-success" aria-hidden="true" />
                  <span className="text-helper leading-relaxed text-stone-800">{t(featureKey)}</span>
                </li>
              ))}
            </ul>

            <Button className="mt-8 w-full" asChild>
              <a href="#final-cta">{t("payg.cta")}</a>
            </Button>

            <p className="mt-4 text-helper leading-relaxed text-stone-600">{t("payg.note")}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
