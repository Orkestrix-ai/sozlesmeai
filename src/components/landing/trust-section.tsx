import { useTranslations } from "next-intl";
import { Archive, CircleCheckBig, History, ShieldCheck } from "lucide-react";

import { Container } from "@/components/landing/container";
import { SectionHeading } from "@/components/landing/section-heading";

const ITEMS = [
  { key: "control", Icon: ShieldCheck },
  { key: "history", Icon: History },
  { key: "archive", Icon: Archive },
  { key: "approval", Icon: CircleCheckBig },
] as const;

/**
 * design.md §6.7 — paper-50 zemin. Güven mesajları: veri kontrolü, sürüm
 * geçmişi, belge arşivi, kullanıcı onayı.
 *
 * Hukuki garanti veya "tamamen hatasız sözleşme" iddiası YASAK; bunun yerine
 * sınırları açıkça yazan bir uyarı bloğu var (PRD §3 ve FR-07 ile uyumlu).
 */
export function TrustSection() {
  const t = useTranslations("trust");

  return (
    <section className="bg-paper-100 py-20 sm:py-28">
      <Container>
        <SectionHeading title={t("title")} description={t("description")} />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6"
            >
              <Icon className="size-6 text-ink-900" aria-hidden="true" />
              <h3 className="mt-4 text-card-title font-semibold text-ink-950">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-helper leading-relaxed text-stone-600">
                {t(`items.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        {/* Kritik vurgu — kırmızı burada dekorasyon değil, sınır işareti. */}
        <div className="mt-8 rounded-[var(--radius)] border-l-2 border-brand-red-600 bg-paper-50 px-6 py-5">
          <h3 className="text-card-title font-semibold text-ink-950">
            {t("disclaimerTitle")}
          </h3>
          <p className="mt-2 max-w-3xl text-helper leading-relaxed text-stone-600">
            {t("disclaimer")}
          </p>
        </div>
      </Container>
    </section>
  );
}
