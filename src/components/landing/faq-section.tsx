import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";

const ITEMS = [
  "accuracy",
  "signature",
  "types",
  "credits",
  "team",
] as const;

/**
 * SSS — navbar'da "SSS" bağlantısı olduğu için eklendi (design.md §6'da
 * ayrı bir bölüm olarak sayılmıyor, ancak §6.1'deki menü ona işaret ediyor).
 *
 * `details/summary` kullanılıyor: JavaScript olmadan da açılır ve klavye ile
 * erişilebilir. design.md §5 gereği border tabanlı, gölgesiz.
 */
export function FaqSection() {
  const t = useTranslations("faq");

  return (
    <section id="faq" className="bg-paper-50 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} />

        <div className="mt-12 max-w-3xl divide-y divide-stone-200 border-y border-stone-200">
          {ITEMS.map((key) => (
            <details key={key} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-card-title font-semibold text-ink-950 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-600">
                {t(`items.${key}.question`)}
                <Plus
                  className="mt-0.5 size-5 shrink-0 text-stone-400 transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 max-w-2xl text-stone-600">
                {t(`items.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
